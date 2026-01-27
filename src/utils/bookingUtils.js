// Função auxiliar para popular guest (User ou Guest)
const populateGuest = async (booking) => {
  if (booking.guestModel === 'Guest') {
    await booking.populate({
      path: 'guest',
      select: 'name phone cpf birthDate',
      model: 'Guest'
    });
  } else {
    await booking.populate({
      path: 'guest',
      select: 'name email',
      model: 'User'
    });
  }
};

// Função auxiliar para popular múltiplos bookings
const populateGuests = async (bookings) => {
  for (let booking of bookings) {
    await populateGuest(booking);
  }
};

module.exports = {
  populateGuest,
  populateGuests
};
