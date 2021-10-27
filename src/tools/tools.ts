import * as Inscribe from "screeps-inscribe";
import * as Config from "config";
import * as M from "memory";
import { log } from "./logger/logger";

export function memoryInit(){
  // Not sure how to solve the Delta Operand Error
  // delete Memory.flags;
  // delete Memory.spawns;
  // delete Memory.creeps;
  // delete Memory.rooms;


  const mem = M.gm();
  mem.creeps = {};
  mem.rooms = {};

  mem.uuid = 0;
  mem.memVersion = M.MemoryVersion;
  log.info("Initiating Game: Using MemVersion: " + mem.memVersion);
}

export function InitRoomMemory(room: Room, roomName: string) {
  const rm: M.RoomMemory = M.gm().rooms[roomName];
  rm.roomName = roomName;
  rm.minerTasks = [];

  const sources = room.find(FIND_SOURCES_ACTIVE);
  for (const sourceName in sources) {
    const source: Source = sources[sourceName] as Source;
      const positions = [
        [source.pos.x - 1, source.pos.y - 1],
        [source.pos.x - 1, source.pos.y + 0],
        [source.pos.x - 1, source.pos.y + 1],

        [source.pos.x + 1, source.pos.y - 1],
        [source.pos.x + 1, source.pos.y + 0],
        [source.pos.x + 1, source.pos.y + 1],

        [source.pos.x + 0, source.pos.y - 1],
        [source.pos.x + 0, source.pos.y + 1]
      ];
    for (const pos of positions ){
      const roomPos: RoomPosition | null = room.getPositionAt(pos[0] , pos[1]);
        if (roomPos !== null){
            const found: string = roomPos.lookFor(LOOK_TERRAIN) as any;
            if (found != "wall") //  tslint:disable-line{
              if(Config.ENABLE_DEBUG_MODE)log.debug("pos " + pos[0] + "," + pos[1] + "=" + found);
                const minerPos: M.PositionPlusTarget ={
                        targetId: source.id,
                        x: pos[0],
                        y: pos[1]
                };
                const minerTask: M.MinerTask = {
                        minerPosition: minerPos
                };

                rm.minerTasks.push(minerTask);
            }
        }
      }
    }


/**
 * Get some basic Info about the game state
 */
export function log_info() {
  // Periodic logging of useful info
  if (Game.time % 100 === 0) {
    // CPU: limit: 30, tickLimit: 500, bucket: 10000, used: 4.08803
    console.log(
      `[${Inscribe.color(Config.FIRST_ROOM_NAME, "skyblue")}]| Game-Tick: ${Game.time}` + "| CPU Used: " + Game.cpu.getUsed() + "| Buck: " + Game.cpu.bucket
    );
  }
}

/**
 * Clear Memory of non Existant Creep
 */
export function ClearNonExistingCreeMemory() {
  if (Game.time % 100 === 0) {
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
        console.log(`[${Inscribe.color("Clearing non-existing creep memory: " + name, "red")}]`);
      }
    }
  }
}

