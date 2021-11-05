import * as Inscribe from "screeps-inscribe";
import * as Config from "config";
import {log} from '../../tools/logger/logger';
import {ENABLE_DEBUG_MODE} from "config";
import * as M from "memory";
import * as RoomManager from "../roomManager";

/**
 * Spawn the Creeps if necessary
 * @export spawnCreep
 * @param {StructureSpawn} spawn The specific Spawn
 * @param {BodyPartConstant[]} bodyParts The BodyParts with which the Creep should be Spawned
 * @param {M.CreepRoles} role The Role of the Spawning Creep
 * @return {*}  {number} The Status Msg from the Spawn as Number
 */
export function spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: M.CreepRoles): number
 {
     const uuid: number = M.gm().uuid
     let status: number | string = spawn.spawnCreep(bodyParts, 'status' , {dryRun: true});


     let properties: any = {
         memory: {
             log: false,
             role: role,
             roleString: M.roleToString(role),
             gathering: true,
         }
     }

     status = _.isString(status) ? OK : status;
     if (status === OK)
     {
         M.gm().uuid = uuid + 1;
         let splitName: string = properties.memory.roleString;
         const [prefix, roleName] = splitName.split('_');

         let creepName: string = spawn.room.name + "-" + roleName + "-"+ uuid;

         log.info("Started creating new creep: " + creepName);
         if (Config.ENABLE_DEBUG_MODE)
         {
             log.info("Body: " + bodyParts);
             log.info("Memory: " + JSON.stringify(properties));
         }

         status = spawn.spawnCreep(bodyParts, creepName, properties as SpawnOptions);

         if(status === OK){
             spawn.room.visual.text(
                 `🛠️ ${roleName}`,
                 spawn.pos.x + 1,
                 spawn.pos.y,
                 { align: "left", opacity: 0.8 });
         }

         return _.isString(status) ? OK : status;
     } else
     {
         if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
         {
             log.info("Failed creating new creep: " + status);
         }

         return status;
     }
 }

/**
 *
 * Try to Spawn the Creep with the given properties
 * @export tryToSpawnCreep
 * @param {StructureSpawn[]} inactiveSpawns The SPawn which should spawn
 * @param {BodyPartConstant[]} bodyParts The Parts of the Creep
 * @param {M.CreepRoles} role The Role that the creep will follow
 */
export function tryToSpawnCreep(inactiveSpawns: StructureSpawn[], bodyParts: BodyPartConstant[], role: M.CreepRoles){
    let spawned: boolean = false;
    _.each(inactiveSpawns, (spawn: StructureSpawn) =>
    {
        if(!spawned){
            const status = spawnCreep(spawn, bodyParts, role);
            if (status === OK) {
                spawned = true;
            }
        }
    });
}

/**
 * Get the Optimal Position to build Container. (Between Source and SPawn)
 * @param {M.MinerTask[]} minerTasksForSource The Miner Tasks for the given Source
 * @param {M.PositionPlusTarget} sourcePos The Position of the Source
 * @param {Room} room The Room where the sources are
 * @return {*}  {(M.PositionPlusTarget | null)} The Optimal Position (x,y)
 */
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
 *
 * Get ID of Container with least Builders assigned
 * @export getContainerIdWithLeastBuildersAssigned
 * @param {Room} room The Room in which the Container is
 * @param {M.RoomMemory} rm The Memory of the RoomMemory
 * @return {*}  {(string | undefined)}  The ID of the Container
 */
export function getContainerIdWithLeastBuildersAssigned(room: Room, rm: M.RoomMemory): string | undefined {
    const choices: M.NodeContainerIdChoice[] = [];
    let LibStruct =  room.find<StructureContainer>(FIND_STRUCTURES);
    let LibCont = _.filter(LibStruct, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];

    _.each(LibCont, (container: StructureContainer) => {

        let count = 0;
        _.each(RoomManager.builders, (tmpBuilder: Creep) => {
            if(M.cm(tmpBuilder).assignedContainerId === container.id) {
                count++;
            }
        });
        const choice: M.NodeContainerIdChoice = {
            id: container.id, count
        };
        log.info(`Container ${container.id} = ${count}`);
        choices.push(choice);
    });

    const sortedChoices = _.sortBy(choices, (choice: M.NodeContainerIdChoice) => choice.count);
    if(sortedChoices.length > 0) {
        log.info(`Best container ${sortedChoices[0].id} = ${sortedChoices[0].count}`);
        return sortedChoices[0].id;
    }

    return undefined
}

/**
 * Initiate the Room. and get Energy-Mining-Positions from SOurces
 * @export InitRoomMemory
 * @param {Room} room The given Room
 * @param {string} roomName The Name of the Room
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
      const containerPos =getOptimalContainerPosition(minerTasksForSource, sourcePos, room);
      log.debug("InitRoomMemory|containerPos: " + JSON.stringify(containerPos));
      if (containerPos !== null){
          rm.containerPositions.push(containerPos);
      }
    }
  }


/**
 *
 * Check if Assigned Tasks have no Miner
 * @export cleanupAssignedMiners
 * @param {M.RoomMemory} rm The RoomMemory
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

