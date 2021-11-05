import * as Inscribe from "screeps-inscribe";
import * as Config from "config";
import * as M from "memory";
import { log } from "./logger/logger";
import {ENABLE_DEBUG_MODE} from "config";

/**
 * Initiate GameMemory
 */
export function memoryInit(){
  // Not sure how to solve the Delta Operand Error
  // delete Memory.flags[0];
  // delete Memory.spawns[0];
  // delete Memory.creeps[0];
  // delete Memory.rooms[0];
  // Object.keys(Memory.flags).forEach(key => {delete Memory.flags[key];});
  // Object.keys(Memory.spawns).forEach(key => {delete Memory.spawns[key];});
  // Object.keys(Memory.creeps).forEach(key => {delete Memory.creeps[key];});
  // Object.keys(Memory.rooms).forEach(key => {delete Memory.rooms[key];});
  // for (const r in Memory.flags){ delete Memory.flags[r]}
  // for (const r in Memory.spawns){ delete Memory.spawns[r]}
  // for (const r in Memory.creeps){ delete Memory.creeps[r]}
  // for (const r in Memory.rooms){ delete Memory.rooms[r]}
  // Memory.flags = {};
  // Memory.spawns = {};
  // Memory.creeps = {};
  // Memory.rooms = {};
  // Should Work now:
  _clearMemory();

  const mem = M.gm();
  mem.creeps = {};
  mem.rooms = {};
  mem.uuid = 0;
  mem.memVersion = M.MemoryVersion;
  log.info("Initiating Game: Using MemVersion: " + mem.memVersion);
}

/**
 * clear Memory
 */
export function _clearMemory(): void {
  for (const name in Memory.flags) {
    if (!(name in Game.flags)) {
      delete Memory.flags[name];
    }
  }
  for (const name in Memory.spawns) {
    if (!(name in Game.spawns)) {
      delete Memory.spawns[name];
    }
  }
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  for (const name in Memory.rooms) {
    if (!(name in Game.rooms)) {
      delete Memory.rooms[name];
    }
  }
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
  rm.energySources = [];
  rm.containerPositions = [];
  rm.desiredBuilders = Config.MAX_BUILDERS;

  let taskIdNum = 0;

  const sources = room.find(FIND_SOURCES_ACTIVE);
  for (const sourceName in sources) {
    const source: Source = sources[sourceName] as Source;
    const sourcePos: M.PositionPlusTarget = {
      targetId: source.id,
      x: source.pos.x,
      y: source.pos.y
    };
    rm.energySources.push(sourcePos);

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
    const minerTasksForSource: M.MinerTask[] = [];
    for (const pos of positions ){
      const roomPos: RoomPosition | null = room.getPositionAt(pos[0] , pos[1]);
      if (roomPos !== null){
        const found: Terrain[] = roomPos.lookFor(LOOK_TERRAIN) as Terrain[];
        if (found.toString() != "wall") {
          if(Config.ENABLE_DEBUG_MODE){
            log.debug("MinerTask-Pos: " + pos[0] + "," + pos[1] + "=" + found);
          }
          const minerPos: M.PositionPlusTarget ={
                  targetId: source.id,
                  x: pos[0],
                  y: pos[1]
          };
          taskIdNum++;
          const minerTask: M.MinerTask = {
                  minerPosition: minerPos,
                  taskId: taskIdNum,
                  sourceContainer: undefined
          };

          rm.minerTasks.push(minerTask);
          minerTasksForSource.push(minerTask);
        }
      }
    }
    const containerPos = getOptimalContainerPosition(minerTasksForSource, sourcePos, room);
    log.debug("InitRoomMemory|containerPos: " + JSON.stringify(containerPos));
    if (containerPos !== null){
        rm.containerPositions.push(containerPos);
    }
  }
}

function getOptimalContainerPosition(minerTasksForSource: M.MinerTask[], sourcePos: M.PositionPlusTarget, room: Room): M.PositionPlusTarget | null{
  const roomPos: RoomPosition | null = room.getPositionAt(sourcePos.x, sourcePos.y);
  if (roomPos === null){
    return null;
  }

  const spawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS);
  if (spawns.length === 0) {
      return null;
  }
  const firstSpawn = spawns[0];

  const choices: M.NodeChoice[] = [];
  log.info(`finding optimal container pos for ${sourcePos.x}, ${sourcePos.y}`);
  for (let x = sourcePos.x - 2; x <= sourcePos.x + 2; x++) {
    for (let y = sourcePos.y - 2; y <= sourcePos.y + 2; y++) {
      const range = roomPos.getRangeTo(x, y);
      if (range === 2) {
        const searchPos: RoomPosition | null = room.getPositionAt(x, y);
        if (searchPos !== null) {
          const found: string = roomPos.lookFor(LOOK_TERRAIN) as any;
          if (found !== "wall")  {
            if(ENABLE_DEBUG_MODE) log.debug(`${x}, ${y} == ${range} is not wall`);
            if(ENABLE_DEBUG_MODE) log.debug("Container-Pos: " + searchPos.x + "," + searchPos.y + "=" + found);

            let dist = _.sum(minerTasksForSource, (task: M.MinerTask) => {
              const taskPos: RoomPosition | null = room.getPositionAt(task.minerPosition.x, task.minerPosition.y);
              if (taskPos === null) {
                  return 0;
              } else {
                  return taskPos.getRangeTo(x, y);
              }
            });
            // log.info(`${x}, ${y} == ${dist} total`);
            dist += firstSpawn.pos.getRangeTo(x, y);
            log.info(`${x}, ${y} == ${dist} total dist including to spawn`);

            const choice: M.NodeChoice = {
                    x, y, dist
            };
            choices.push(choice);
          }
        }
      }
    }
  }

  const sortedChoices = _.sortBy(choices, (choice: M.NodeChoice) => choice.dist);
  if (sortedChoices.length > 0) {
    log.info(`Cont: Best choice is ${sortedChoices[0].x}, ${sortedChoices[0].y} == ${sortedChoices[0].dist}`);
    const containerPos: M.PositionPlusTarget = {
        targetId: sourcePos.targetId,
        x: sortedChoices[0].x,
        y: sortedChoices[0].y
    };
    if(ENABLE_DEBUG_MODE) log.debug("ContPos: " + JSON.stringify(containerPos));
    return containerPos;
  }

  return null;
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
            log.info(`[${Inscribe.color(`Clearing mining task assigned to ${task.assignedMinerName}`, "red")}]`);
            task.assignedMinerName = undefined;
          } else if(M.cm(creep).role !== M.CreepRoles.ROLE_MINER){
            task.assignedMinerName = undefined;
            // log.info(`Clearing mining task assigned to ${task.assignedMinerName}`);
            log.info(`[${Inscribe.color(`Clearing mining task assigned to ${task.assignedMinerName}`, "red")}]`);
          }
      }
  }
}


/**
 * Generate Pixel if Bucket >= number
 * @param bucketHight The Amount of minimal Bucket
 */
export function generatePixel(bucketHight: number): void {
  if (Game.cpu.bucket >= bucketHight) {
      Game.cpu.generatePixel();
  }
}

/**
 * Creates a Link to the given Room
 * @param roomName The Room name
 * @returns Link
 */
export function roomLink(roomName: string): string {
  return `<a href="https://screeps.com/a/#!/room/${Game.shard.name}/${roomName}">${roomName}</a>`;
}

/**
 * Does the function with each Creep.
 * @param func The given Function
 */
export const forEachCreep = (func: (item: Creep) => void): void => {
  Object.values(Game.creeps).forEach((creep) => func(creep));
};

/**
 * Get the average distance between Start and End point.
 * @param pos1 Start Position (x,y)
 * @param pos2 End Position (x,y)
 * @returns The distance between both points as Number
 */
export function distance(start: { x: number; y: number }, end: { x: number; y: number }): number {
  return Math.max(Math.abs(start.x - end.x), Math.abs(start.y - end.y));
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
 * Clear Memory of non Existent Creep
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



