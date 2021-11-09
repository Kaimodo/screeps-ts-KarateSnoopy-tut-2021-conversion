import {log} from '../tools/logger/logger';
import * as M from "../memory";
import * as Tools from "../tools/tools";
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

    // const constructionSitesT = room.find(FIND_MY_CONSTRUCTION_SITES);
    // const extensionConstructionSitesT = _.filter(constructionSitesT, (site: ConstructionSite) => site.structureType === STRUCTURE_EXTENSION);
    // log.debug("BuildRun :" + JSON.stringify(extensionConstructionSitesT, null, 4));

    if(creepMem.assignedContainerId === undefined){
        creepMem.assignedContainerId = RLib.getContainerIdWithLeastBuildersAssigned(room, rm);
    }

    room.visual.text(
        `🛠️`,
        creep.pos.x,
        creep.pos.y,
        { align: "center", opacity: 0.8 }
    );

    if(creepMem.assignedContainerId === undefined){
        //log.error(`${M.l(creepMem)}not assigned to container`);
        return;
    }

    if (creepMem.gathering && creep.store[RESOURCE_ENERGY] === creep.store.getCapacity(RESOURCE_ENERGY)){
        creepMem.gathering = false;
    }
    if (!creepMem.gathering && creep.store[RESOURCE_ENERGY] === 0){
        creepMem.gathering = true;
        creepMem.isUpgradingController = false;
        if (creepMem.assignedTargetId !== undefined){
            const assignedTargetId: Id<Structure> = creepMem.assignedContainerId as Id<Structure>;
            const target = Game.getObjectById(assignedTargetId) as Structure;
            if (target.structureType === STRUCTURE_EXTENSION) {
                RLib.removeAssignedExt(target.id, rm);
            }
        }
        creepMem.assignedTargetId = undefined;
    }
    if(creepMem.gathering){
        // log.info(`${M.l(creepMem)}builder is moving to container`);
        pickupEnergy(creep, creepMem, rm);
    } else {
        // log.info(`${M.l(creepMem)}builder is using energy`);
        useEnergy(room, creep, creepMem, rm);
    }
    tryToBuildRoad(rm, creep, room, creepMem);
}

/**
 *
 * Check if Extension is already assigned
 * @param {Structure} structure The Structure to check
 * @param {M.RoomMemory} rm The RoomMemory
 * @return {*}  {boolean}
 */
function isAlreadyTaken(structure: Structure, rm: M.RoomMemory): boolean{
    if (structure.structureType === STRUCTURE_EXTENSION) {
        const isAssigned = _.find(rm.extensionIdsAssigned, (ext: string) => ext === structure.id);
        if (isAssigned !== undefined) {
            return true;
        }
    }
    return false;
}

/**
 * Pick up energy
 * @param {Creep} creep The given Creep
 * @param {M.CreepMemory} cm the CreepMemory
 * @param {M.RoomMemory} rm the RoomMemory
 */
function pickupEnergy(creep: Creep, cm: M.CreepMemory, rm: M.RoomMemory): void{
    // creep.say("pickUpEnergy");
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
        log.info(`${M.l(cm)}Transfer error ${errCode}`);
    }
}

/**
 *
 * Check if a Structure is filled with Energy
 * @param {Structure} structure The Structure to check
 * @return {*}  {boolean} true or not
 */
function isStructureFullOfEnergy(structure: Structure): boolean {
    if (structure.structureType === STRUCTURE_EXTENSION){
        const structExt: StructureExtension = structure as StructureExtension;
        return structExt.store[RESOURCE_ENERGY] >= structExt.store.getCapacity(RESOURCE_ENERGY);
    }
    if (structure.structureType === STRUCTURE_SPAWN){
        const structExt: StructureExtension = structure as StructureExtension;
        return structExt.store[RESOURCE_ENERGY] >= structExt.store.getCapacity(RESOURCE_ENERGY);
    }
    if (structure.structureType === STRUCTURE_TOWER){
        const structExt: StructureExtension = structure as StructureExtension;
        return structExt.store[RESOURCE_ENERGY] >= structExt.store.getCapacity(RESOURCE_ENERGY);
    }
    return true
}

/**
 * Use Energy carried
 * @param {Room} room The current Room
 * @param {Creep} creep The current Creep
 * @param {M.CreepMemory} cm The Creep Memory of the Builder
 * @param {M.RoomMemory} rm The Memory of the Room
 */
function useEnergy(room: Room, creep: Creep, cm: M.CreepMemory, rm: M.RoomMemory): void {
    // creep.say("useEnergy");
    let target: Structure | undefined;
    if (cm.assignedTargetId !== undefined){
        const targetId:  Id<Structure> = cm.assignedTargetId as Id<Structure>;
        target = Game.getObjectById(targetId) as Structure;
        if (isStructureFullOfEnergy(target)){
            if (target.structureType === STRUCTURE_EXTENSION) {
                RLib.removeAssignedExt(target.id, rm);
            }
            cm.assignedTargetId = undefined;
            target = undefined;
        }
    }
    //log.info(`${M.l(cm)}cm.assignedTargetId=${cm.assignedTargetId} cm.isUpgradingController=${cm.isUpgradingController}`);
    if (cm.assignedTargetId === undefined && !cm.isUpgradingController){
        const targets: Structure[] = creep.room.find(FIND_STRUCTURES, {
            filter: (structure: Structure) =>{
                return !isStructureFullOfEnergy(structure) && !isAlreadyTaken(structure, rm);
            }
        });
        if (targets.length > 0){
            target = targets[0];
            cm.assignedTargetId = target.id;
            if (target.structureType === STRUCTURE_EXTENSION) {
                // log.info(`${M.l(cm)}Assigned ext ${target.id}`);
                // log.info(`${M.l(cm)}rm.ExtId ${JSON.stringify(rm.extensionIdsAssigned)}`);
                rm.extensionIdsAssigned.push(target.id);
            }
        }
    }
    if (room.controller !== undefined && room.controller.ticksToDowngrade < 1000){
        target = undefined;
    }
    if (target !== undefined){
        //creep.say(`transferring`);
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE){
            creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
        }
    }else{
        if (room.controller !== undefined && room.controller.ticksToDowngrade > 1000){
            if(repairIfCan(room, creep, cm)){
                return;
            }

            if(buildIfCan(room, creep, cm)){
                return;
            }

        }
        if (room.controller !== undefined){
            //creep.say(`upgrading`);
            cm.isUpgradingController = true;
            const status = creep.upgradeController(room.controller);
            if (status === ERR_NOT_IN_RANGE)
            {
                const moveCode = creep.moveTo(room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
                if (moveCode !== OK && moveCode !== ERR_TIRED)
                {
                    log.info(`${M.l(cm)}move and got ${moveCode}`);
                }
            }
        }
    }
}

/**
 *
 * Repair Target if able to
 * @param {Room} room The Room of the Target
 * @param {Creep} creep The repairing Creep
 * @param {M.CreepMemory} cm The Memory of this Creep
 * @return {*}  {boolean} Can/not repair
 */
function repairIfCan(room: Room, creep: Creep, cm: M.CreepMemory): boolean{
    let repairTarget: Structure | undefined;

    let structures: Structure[] = room.find<StructureContainer>(FIND_STRUCTURES);
    let notRoadNeedingRepair: Structure[] = _.filter(structures, (structure) => {
        if (structure.structureType !== STRUCTURE_ROAD){
            const hitsToRepair = structure.hitsMax - structure.hits;
            if (hitsToRepair > structure.hitsMax * 0.25) {
                return true;
            }
        }
        return false;
    }) as Structure[];
    // log.debug(`${M.l(cm)}Not Roads to repair: ${notRoadNeedingRepair}`);

    if (notRoadNeedingRepair.length > 0){
        repairTarget = notRoadNeedingRepair[0];
    }
    if (repairTarget === undefined){
        const structuresUnderFeet = creep.pos.lookFor(LOOK_STRUCTURES) as Structure[];
        if (structuresUnderFeet.length > 0){
            const roadsUnderFeed = _.filter(structuresUnderFeet, (structure) => structure.structureType === STRUCTURE_ROAD) as StructureRoad[];
            if (roadsUnderFeed.length > 0){
                if (roadsUnderFeed[0].hits + 50 < roadsUnderFeed[0].hitsMax){
                    repairTarget = roadsUnderFeed[0];
                }
            }
        }
    }
    if (repairTarget !== undefined) {
        const status = creep.repair(repairTarget);
        if (status === ERR_NOT_IN_RANGE){
            const moveCode = creep.moveTo(repairTarget, { visualizePathStyle: { stroke: "#ffffff" } });
            if (moveCode !== OK && moveCode !== ERR_TIRED){
                log.info(`${M.l(cm)}move and got ${moveCode}`);
            }
        }
        return true;
    }
    return false;
}

/**
 *
 * Try to build on construction Site
 * @param {Room} room The Room
 * @param {Creep} creep The building Creep
 * @param {M.CreepMemory} cm Creeps memory
 * @return {*}  {boolean} can/not build
 */
function buildIfCan(room: Room, creep: Creep, cm: M.CreepMemory): boolean{
    let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    if (constructionSites.length > 0){
         const status = creep.build(constructionSites[0]);
         if (status === ERR_NOT_IN_RANGE){
             const moveCode = creep.moveTo(constructionSites[0], { visualizePathStyle: { stroke: "#ffffff" } });
             if (moveCode !== OK && moveCode !== ERR_TIRED){
                 log.info(`${M.l(cm)}move and got ${moveCode}`);
             }
         }
         return true;
     } else {
         return false;
     }
 }


 /**
  * Try to build a road
  * @param rm The Room Memory
  * @param creep The building Creep
  * @param room The Room where to build
  * @param cm Creeps memory
  * @returns can/not build
  */
 function tryToBuildRoad(rm: M.RoomMemory, creep: Creep, room: Room, cm: M.CreepMemory){
     if ((Game.time + 5) % 10 === 0){
        // log.info(`${M.l(cm)} ${creep.name}: tryToBuildRoad`);
        if (rm.techLevel >= 5 && rm.buildsThisTick === 0){
             const errCode = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
             if (errCode === OK){
                 log.info(`${M.l(cm)} Created road at ${creep.pos}`);
                 rm.buildsThisTick++;
                 return;
             }
         }
     }
 }
