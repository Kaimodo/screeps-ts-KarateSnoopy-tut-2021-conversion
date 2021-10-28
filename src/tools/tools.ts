import * as Inscribe from "screeps-inscribe";
import * as Config from "config";
import * as M from "memory";
import { log } from "./logger/logger";

/**
 * Initiate GameMemory
 */
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

/**
 * Initiate the Room. and get Energy-Mining-Positions from SOurces
 * @param room The given Room
 * @param roomName The Name of the Room
 */
export function InitRoomMemory(room: Room, roomName: string) {
  const rm: M.RoomMemory = M.gm().rooms[roomName];
  rm.roomName = roomName;
  rm.minerTasks = [];

  let taskIdNum = 0;

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
          const found: Terrain[] = roomPos.lookFor(LOOK_TERRAIN) as Terrain[];
          if (found.toString() != "wall") {
            if(Config.ENABLE_DEBUG_MODE)log.debug("MinerTask-Pos: " + pos[0] + "," + pos[1] + "=" + found);
              const minerPos: M.PositionPlusTarget ={
                      targetId: source.id,
                      x: pos[0],
                      y: pos[1]
              };
              taskIdNum++;
              const minerTask: M.MinerTask = {
                      minerPosition: minerPos,
                      taskId: taskIdNum
              };

              rm.minerTasks.push(minerTask);
          }
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

/**
 * Check if Assigned Tasks have no Miner
 * @param rm The RoomMemory
 */
export function cleanupAssignedMiners(rm: M.RoomMemory){
  for (const task of rm.minerTasks){
      if(task.assignedMinerName !== undefined){
          const creep = Game.creeps[task.assignedMinerName];
          if(creep as any === undefined){
            log.info(`Clearing minning task assigned to ${task.assignedMinerName}`);
            task.assignedMinerName = undefined;
          } else if(M.cm(creep).role !== M.CreepRoles.ROLE_MINER){
            task.assignedMinerName = undefined;
            log.info(`Clearing minning task assigned to ${task.assignedMinerName}`);
          }
      }
  }
}

