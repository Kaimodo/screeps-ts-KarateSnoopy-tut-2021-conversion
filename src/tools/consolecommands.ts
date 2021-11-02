import * as Inscribe from "screeps-inscribe";
import * as M from "memory";

const Colors = ["cyan", "red", "green", "yellow", "white", "purple", "pink", "orange"];

export const ConsoleCommands = {

  /**
   * To Test wheater Console Commands work
   */
  test() {
    console.log(`[${Inscribe.color("CC", "red")}] Commands working`);
  },
  /**
   * Set the actual Memory Version
   * @param The Number u wanna Set
   */
  setMem(param: number) {
    M.setMemVersion(param);
    console.log(`[${Inscribe.color("CC", "blue")}] Setting Game-Memory-Version to ${M.MemoryVersion}`);
  },

  /**
   * Get the actual Memory version
   */
  getMem() {
    console.log(`[${Inscribe.color("CC", "green")}] Game-Memory-Version: ${M.MemoryVersion}`);
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
