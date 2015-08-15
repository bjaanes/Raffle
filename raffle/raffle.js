(function () {
    if (Meteor.isClient) {

        Template.raffle.helpers({
            'anyWinners': function () {
                return this.winners.length;
            },
            'isDone': function () {
                return this.done;
            },
            'numberOfParticipants': function () {
                return this.participants.length;
            },
            'numberOfTickets': function () {
                var numberOfTickets = 0;

                for (var i = 0; i < this.participants.length; ++i) {
                    numberOfTickets += parseInt(this.participants[i].tickets);
                }

                return numberOfTickets;
            },
            'getPossibleUsers': function () {
                var participantUserIdList = this.participants.map(function (currentParticipant) {
                    return currentParticipant.userId;
                });

                var winnerUserIdList = this.winners.map(function (currentWinner) {
                    return currentWinner.userId;
                });

                var impossibleUserIds = participantUserIdList.concat(winnerUserIdList);

                return Users.find({
                    '_id': {
                        '$nin': impossibleUserIds
                    }
                });
            }
        });

        Template.raffle.events({
            'click .mdl-button--big-ass-button': function() {
                var pool = [];

                for (var i = 0; i < this.participants.length; ++i) {
                    var participant = this.participants[i];

                    for (var j = 0; j < parseInt(participant.tickets); ++j) {
                        pool.push(participant);
                    }
                }

                if (pool.length === 0) {
                    return;
                }

                console.log('pool:');
                console.log(pool);

                // Draw winner
                var winningNumber = getRandomInt(0, pool.length);
                console.log('winningNumber:');
                console.log(winningNumber);
                var winner = pool[winningNumber];
                this.winners.push(winner);
                removeWinnerFromParticipants(this.participants, winner);

                var winnerName = Users.findOne(winner.userId).name;


                // Play awesome drum roll to get people excited
                var audio = new Audio('/drumroll.mp3');
                var that = this;
                audio.addEventListener('ended', function() {
                    // Update data
                    Raffles.update({_id: that._id}, {
                        $set: {
                            winners: that.winners,
                            participants: that.participants
                        }
                    });

                    // Show winner
                    var el = $('#winner-announcement-popup');
                    el.html('<h1>' + winnerName + '</h1>');
                    if (el.length) {
                        $.magnificPopup.open({
                            items: {
                                src: el
                            },
                            type: 'inline',
                            closeOnContentClick: true
                        });
                    }

                }, false);
                audio.play();


                function removeWinnerFromParticipants(participants, winner) {
                    for (var k = 0; k < participants.length; ++k) {
                        var currentParticipant = participants[k];
                        if (currentParticipant.userId === winner.userId) {
                            participants.splice(k, 1);
                            return;
                        }
                    }
                }

                // Returns a random integer between min (included) and max (excluded)
                function getRandomInt(min, max) {
                    return Math.floor(Math.random() * (max - min)) + min;
                }
            },
            'click #deleteParticipant': function () {
                var parentData = Template.parentData();


                var participantsCopy = parentData.participants.slice();
                for (var i = 0; i < participantsCopy.length; ++i) {
                    var currentParticipant = participantsCopy[i];

                    if (currentParticipant.userId === this.userId) {
                        participantsCopy.splice(i, 1);
                        break; // Should only ever be one with that userId, lets stop here
                    }
                }

                Raffles.update({_id: parentData._id}, {
                    $set: {
                        participants: participantsCopy
                    }
                });
            },
            'click #deleteWinner': function () {
                var parentData = Template.parentData();

                var winnersCopy = parentData.winners.slice();
                for (var i = 0; i < winnersCopy.length; ++i) {
                    var currentWinner = winnersCopy[i];

                    if (currentWinner.userId === this.userId) {
                        winnersCopy.splice(i, 1);
                        break; // Should only ever be one with that id, lets stop here
                    }
                }

                Raffles.update({_id: parentData._id}, {
                    $set: {
                        winners: winnersCopy
                    }
                });
            },
            'submit .new-raffle-participant': function (event) {
                event.preventDefault();

                var participant = {
                    userId: event.target.participantId.value,
                    tickets: event.target.numberOfTickets.value
                };

                var alreadyEntered = (this.participants.filter(function (element) {
                    return element.userId === participant.userId;
                }).length > 0);

                var alreadyWon = (this.winners.filter(function (element) {
                    return element.userId === participant.userId;
                }).length > 0);

                if (alreadyEntered || alreadyWon) {
                    // TODO: SHOW SOME SORT OF ERROR
                    alert('YOU HAVE ALREADY ENTERED THIS RAFFLE!')
                } else {
                    Raffles.update({ _id: this._id }, {
                        $push: {
                            participants: participant
                        }
                    });
                }

                event.target.reset();
            },
            'click #deleteRaffle': function () {
                var confirmDelete = confirm('Are you sure you want to delete this raffle?');

                if (confirmDelete) {
                    Raffles.remove(this._id);
                    Router.go('/');
                }

            }
        });
    }
})();