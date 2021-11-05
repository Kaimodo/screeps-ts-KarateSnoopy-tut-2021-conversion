import {log} from '../tools/logger/logger';
import * as M from "../memory";
import * as RoomManager from "./roomManager";
import * as RLib from "./Lib/lib";


/**
 *
 * Screeps Builder
 * @export Main Builder function to execute
 * @param {Room} room The Room in which the Builder works
 * @param {Creep} creep The Creep which is the Builder
 * @param {M.RoomMemory} rm The RoomMemory of the given Room
 */
export function run(room: Room, creep: Creep, rm: M.RoomMemory): void {
    const creepMem = M.cm(creep);

    if(creepMem.assignedContainerId === undefined){
        creepMem.assignedContainerId = RLib.getContainerIdWithLeastBuildersAssigned(room, rm);
        log.debug("BRunAssConId(): " + RLib.getContainerIdWithLeastBuildersAssigned(room, rm))
        log.debug("BrunCreepMem: "+ creepMem.assignedContainerId);
    }
    if(creepMem.assignedContainerId === undefined){
        log.error(`${creep.name} is not assigned to container`);
        return;
    }

    if (creepMem.gathering && creep.store[RESOURCE_ENERGY] === creep.store.getCapacity(RESOURCE_ENERGY)){
        creepMem.gathering = false;
    }
    if (!creepMem.gathering && creep.store[RESOURCE_ENERGY] === 0){
        creepMem.gathering = true;
    }
    if(creepMem.gathering){
        pickupEnergy(creep, creepMem, rm);
    } else {
        useEnergy(room, creep);
    }
}

/**
 * Pick up energy
 * @param {Creep} creep The given Creep
 * @param {M.CreepMemory} cm the CreepMemory
 * @param {M.RoomMemory} rm the RoomMemory
 */
function pickupEnergy(creep: Creep, cm: M.CreepMemory, rm: M.RoomMemory): void{
    // creep.say("pickUpEnnergy");
    const targetId: Id<StructureContainer> = cm.assignedContainerId as Id<StructureContainer>;
    const target = Game.getObjectById(targetId) as StructureContainer;

    if(target === null){
        cm.assignedContainerId = undefined;
    }

    let energyCount = 0;
    if(creep.store[RESOURCE_ENERGY] !== undefined){
        energyCount = creep.store[RESOURCE_ENERGY];
    }

    const amtEnergy =  creep.store[RESOURCE_ENERGY] - energyCount;
    const errCode = creep.withdraw(target, RESOURCE_ENERGY, amtEnergy);
    if(errCode === ERR_NOT_IN_RANGE){
        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
    }
    if (errCode !== OK && errCode !== ERR_NOT_IN_RANGE && errCode !== ERR_NOT_ENOUGH_RESOURCES){
        log.error(`Transfer error: ${errCode}`);
    }
}
/**
 * Use Energy carried
 * @param {Room} room The current Room
 * @param {Creep} creep The current Creep
 */
function useEnergy(room: Room, creep: Creep): void {
    // creep.say("useEnergy");
    const targets: Structure[] = creep.room.find(FIND_STRUCTURES,{
        filter: (structure: Structure) => {
            if (structure.structureType === STRUCTURE_EXTENSION){
                    const structExt: StructureExtension = structure as StructureExtension;
                    return structExt.store[RESOURCE_ENERGY] < structExt.store.getCapacity(RESOURCE_ENERGY)
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
    if(targets.length > 0){
        if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
        }
    } else {
        if (room.controller !== undefined){
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


/**
 * Check if there are Construction site and build them
 * @export buildIfCan
 * @param {Room} room The Room in which the Builder works
 * @param {Creep} creep The Creep which is the Builder
 * @return {*}  {boolean} True if something can be build
 */

export function buildIfCan(room: Room, creep: Creep): boolean {
    log.info(`buildIfCan ${room.name}, ${creep.name}`);

    const targets = room.find(FIND_CONSTRUCTION_SITES) as ConstructionSite[];
    if (targets.length > 0) {
        const status = creep.build(targets[0]);
        if (status === ERR_NOT_IN_RANGE) {
            const moveCode = creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            if (moveCode !== OK && moveCode !== ERR_TIRED) {
                log.error(`move and got: ${moveCode}`);
            }
        }
        return true;
    } else {
        return false;
    }
}
