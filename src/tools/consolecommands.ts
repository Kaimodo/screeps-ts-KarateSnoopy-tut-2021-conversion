import * as Inscribe from "screeps-inscribe";

const Colors = ["cyan", "red", "green", "yellow", "white", "purple", "pink", "orange"];

export const ConsoleCommands = {

  /**
   * To Test wheater Console Commands work
   */
  test() {
    console.log(`[${Inscribe.color("CC", "red")}] Commands working`);
  },

  /**
   * Kill all Creeps in given Room
   * @param roomName The Room Name
   */
  killall(roomName?: string) {
    _.forEach(Game.creeps, (c: Creep) => {
      if ((roomName && c.room.name === roomName) || !roomName) {
        c.suicide();
      }
    });
  }
};
