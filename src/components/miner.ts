import {log} from '../tools/logger/logger';
import * as M from "../memory";
import * as RoomManager from "./roomManager";
import {ENABLE_DEBUG_MODE} from "../config";

/**
 * Main Miner Function called by The RoomManager
 * @export run
 * @param {Room} room The Room in which the Miner works
 * @param {Creep} creep The Creep-Object which is running this Function
 * @param {M.RoomMemory} rm The RoomMemory-Object
 * @return {*}  {void}
 */
export function run(room: Room, creep: Creep, rm: M.RoomMemory): void {
    const creepMem = M.cm(creep);
    if (creepMem.assignedMineTaskId === undefined) {
        log.info(`${creep.name}: Miner has no Mining Task`);
        const unassignedTasks = _.filter(rm.minerTasks, (t: M.MinerTask) => t.assignedMinerName === undefined);
        log.info('Found unassigned Miner Tasks: '+ unassignedTasks.length)
        if(unassignedTasks.length == 0){
            log.error('No unassigned Tasks found');
        } else {
            unassignedTasks[0].assignedMinerName = creep.name;
            creepMem.assignedMineTaskId = unassignedTasks[0].taskId;
        }
    }else {
        if (creepMem.gathering && creep.store[RESOURCE_ENERGY] === creep.store.getCapacity(RESOURCE_ENERGY)){
            creepMem.gathering = false;
        }
        if (!creepMem.gathering && creep.store[RESOURCE_ENERGY] === 0){
            creepMem.gathering = true;
        }
        // store[RESOURCE_ENERGY] < creep.store.getCapacity()
        // store.getFreeCapacity(RESOURCE_ENERGY) < creep.store.getCapacity()

        const minerTask = rm.minerTasks.find((t: M.MinerTask) => t.taskId === creepMem.assignedMineTaskId);
        if (minerTask === undefined) {
            return;
        }
        if (!creepMem.gathering) {
            // log.info(`${creep.name}: Miner has ${creep.store[RESOURCE_ENERGY]} and is working on dropping off`);
            dropOffEnergy(room, creep, rm, minerTask);
        } else {
            // const energySource = creep.room.find(FIND_SOURCES_ACTIVE)[0];
            // log.info(`${creep.name}: Miner is moving to Mine`);
            harvestEnergy(creep, creepMem, rm, minerTask);
        }
    }

}

/**
 *
 * Harvest Energy at the given Mining Target from the Task in the RoomMemory
 * @param {Creep} creep The given Creep
 * @param {M.CreepMemory} cm The Memory of given Creep
 * @param {M.RoomMemory} rm The RoomMemory
 * @param {M.MinerTask} minerTask Task the given Creep is assigned to.
 */
function harvestEnergy(creep: Creep, cm: M.CreepMemory, rm: M.RoomMemory, minerTask: M.MinerTask): void {
    // log.info(`${creep.name}: Miner is moving to mine`);
    // log.info(`${creep.name}: Miner got miner Task ${minerTask.taskId}`);
    if (creep.pos.x != minerTask.minerPosition.x ||
        creep.pos.y != minerTask.minerPosition.y){
            // log.info(`${creep.name}: Miner is not in Position at ${minerTask.minerPosition.x},${minerTask.minerPosition.y}`);
            const pos = creep.room.getPositionAt(minerTask.minerPosition.x, minerTask.minerPosition.y);
            if (pos !== null){
                creep.moveTo(pos, {visualizePathStyle: {stroke: '33ff00'} });
                // creep.moveTo(pos, {visualizePathStyle: {stroke: '33ff00'} });
            }else{
                log.error(`can't find Pos: ${pos}`);
            }

    } else {
        // log.info(`${creep.name}: Miner is in Position at ${minerTask.minerPosition.x},${minerTask.minerPosition.y}`);
        const sourceId: Id<Source> = minerTask.minerPosition.targetId as Id<Source>;
        const source = Game.getObjectById(sourceId) as Source;
        const errCode = creep.harvest(source);
        if(errCode !== OK && errCode !== ERR_NOT_IN_RANGE && errCode !== ERR_NOT_ENOUGH_RESOURCES){
            log.error(`harvester error: ${errCode}`);
        }
    }
}

/**
 *
 * Build Construction site if able to.
 * @param {Room} room The given Room to build in
 * @param {Creep} creep The Creep which gets the building order
 * @param {M.RoomMemory} rm  The RoomMemory of the Room
 * @return {*}  {boolean} True if building is possible
 */
function buildIfCan(room: Room, creep: Creep, rm: M.RoomMemory): boolean{

    // Find Container-Construction Sites
    const targets = room.find(FIND_CONSTRUCTION_SITES, {
        filter: (constructionSite: ConstructionSite) => {
            return (constructionSite.structureType === STRUCTURE_CONTAINER);
        }
    }) as ConstructionSite[];
    if(targets.length > 0){
        const status = creep.build(targets[0]);
        if(status === ERR_NOT_IN_RANGE){
            const moveCode = creep.moveTo(targets[0], {visualizePathStyle: {stroke: '0000ff'}});
            if(moveCode !== OK && moveCode !== ERR_TIRED){
                log.error(`move and got: ${moveCode}`);
            }
        }
        return true;
    } else {
        // Do I have all construction sites for all the containers?
        // log.debug("RMConPos: " + JSON.stringify(rm.containerPositions));
        if(ENABLE_DEBUG_MODE) log.debug("RoomManager.containers.length: " + RoomManager.containers.length + " | rm.containerPositions.length: " + rm.containerPositions.length);
        if(RoomManager.containers.length !== rm.containerPositions.length){
            _.each(rm.containerPositions, (containerPos: M.PositionPlusTarget) => {
                log.info(`Creating container at: ${containerPos.x}, ${containerPos.y}`);
                const roomPos: RoomPosition | null = room.getPositionAt(containerPos.x, containerPos.y);
                if (roomPos !== null) {
                    creep.room.createConstructionSite(roomPos, STRUCTURE_CONTAINER);
                }
            });
        }
        return false;
    }
}

/**
 *
 * dropOffEnergy carried
 * @param {Room} room The Room in which the Miner is working
 * @param {Creep} creep The given Creep
 * @param {M.RoomMemory} rm The RoomMemory
 * @param {M.MinerTask} minerTask The given Miner task
 */
function dropOffEnergy(room: Room, creep: Creep, rm: M.RoomMemory, minerTask: M.MinerTask): void{
     let target: Structure | undefined;

     let MinerStruct =  room.find<StructureContainer>(FIND_STRUCTURES);
     let MinerContainers = _.filter(MinerStruct, (structure) => structure.structureType === STRUCTURE_CONTAINER) as StructureContainer[];
     let MinerCreeps = room.find(FIND_MY_CREEPS);
     let MinerBuilders = _.filter(MinerCreeps, (creep) => M.cm(creep).role === M.CreepRoles.ROLE_BUILDER);
     // log.debug("M.MinCont: "+ MinerContainers.length + " | M.MinBuild: " + MinerBuilders.length);
     if (minerTask.sourceContainer === undefined ||
            MinerBuilders.length + 1 >= rm.desiredBuilders){
            if (MinerContainers.length === rm.containerPositions.length &&
                MinerBuilders.length + 1 >= rm.desiredBuilders){
             const foundContainerPos = _.find(rm.containerPositions, (containerPos: M.PositionPlusTarget) => containerPos.targetId === minerTask.minerPosition.targetId);
             if (foundContainerPos !== null){
                 if (foundContainerPos){
                    const roomPos: RoomPosition | null = room.getPositionAt(foundContainerPos.x, foundContainerPos.y);
                    if (roomPos !== null) {
                        const targets = roomPos.lookFor("structure") as Structure[];
                        if (targets.length > 0) {
                            target = targets[0];
                            // log.info(`Found matching containerPos ${target.id}`);
                        }
                    }
                 }
             }
         }

         if (target === undefined){
             const targets: Structure[] = creep.room.find(FIND_STRUCTURES,{
                     filter: (structure: Structure) =>{
                         if (structure.structureType === STRUCTURE_EXTENSION){
                             const structExt: StructureExtension = structure as StructureExtension;
                             return structExt.store[RESOURCE_ENERGY] < structExt.store.getCapacity(RESOURCE_ENERGY);
                         }
                         if (structure.structureType === STRUCTURE_SPAWN){
                             const structSpawn: StructureSpawn = structure as StructureSpawn;
                             return structSpawn.store[RESOURCE_ENERGY] < structSpawn.store.getCapacity(RESOURCE_ENERGY);
                         }
                         if (structure.structureType === STRUCTURE_TOWER){
                             const structTower: StructureTower = structure as StructureTower;
                             return structTower.store[RESOURCE_ENERGY] < structTower.store.getCapacity(RESOURCE_ENERGY);
                         }

                         return false;
                     }
                 });

             if (targets.length > 0){
                 target = targets[0];
             }
         }
     } else {
        const targetId: Id<StructureContainer> = minerTask.sourceContainer.targetId as Id<StructureContainer>;
        target = Game.getObjectById(targetId) as Structure;
         log.info(`Going to: ${target}`);
     }

     if (target !== undefined){
         if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
             creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
         }
     } else {
         if (room.controller !== undefined){
             let isBuilding = false;
             if (room.controller.ticksToDowngrade > 1000){
                 isBuilding = buildIfCan(room, creep, rm);
             }

             if (!isBuilding){
                 const status = creep.upgradeController(room.controller);
                 if (status === ERR_NOT_IN_RANGE){
                     const moveCode = creep.moveTo(room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
                     if (moveCode !== OK && moveCode !== ERR_TIRED){
                         log.error(`move and got: ${moveCode}`);
                     }
                 }
             }
         }
     }
 }
