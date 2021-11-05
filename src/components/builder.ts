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
    }

    room.visual.text(
        `🛠️`,
        creep.pos.x,
        creep.pos.y,
        { align: "center", opacity: 0.8 }
    );

    if(creepMem.assignedContainerId === undefined){
        M.lNameRoleErr(creepMem, ` not assigned to COntainer`);
        return;
    }

    if (creepMem.gathering && creep.store[RESOURCE_ENERGY] === creep.store.getCapacity(RESOURCE_ENERGY)){
        creepMem.gathering = false;
    }
    if (!creepMem.gathering && creep.store[RESOURCE_ENERGY] === 0){
        creepMem.gathering = true;
    }
    if(creepMem.gathering){
        M.lNameRole(creepMem, ` builder is moving to container.`);
        pickupEnergy(creep, creepMem, rm);
    } else {
        M.lNameRole(creepMem, ` builder is using energy.`);
        useEnergy(room, creep, creepMem);
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
        M.lNameRoleErr(cm, `Transfer error: ${errCode}`);
    }
}
/**
 * Use Energy carried
 * @param {Room} room The current Room
 * @param {Creep} creep The current Creep
 * @param {M.CreepMemory} cm The Creep Memory of the Builder
 */
function useEnergy(room: Room, creep: Creep, cm: M.CreepMemory): void {
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
            creep.say("upgrading");
            const status = creep.upgradeController(room.controller);
            if (status === ERR_NOT_IN_RANGE){
                const moveCode = creep.moveTo(room.controller, { visualizePathStyle: { stroke: "#ffffff" } });
                if (moveCode !== OK && moveCode !== ERR_TIRED){
                    M.lNameRoleErr(cm, `move and got: ${moveCode}`);
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
 * @param {M.CreepMemory} cm The Creep Memory of the Builder
 * @return {*}  {boolean} True if something can be build
 */

export function buildIfCan(room: Room, creep: Creep, cm: M.CreepMemory): boolean {
    log.info(`buildIfCan ${room.name}, ${creep.name}`);

    const targets = room.find(FIND_CONSTRUCTION_SITES) as ConstructionSite[];
    if (targets.length > 0) {
        const status = creep.build(targets[0]);
        if (status === ERR_NOT_IN_RANGE) {
            const moveCode = creep.moveTo(targets[0], { visualizePathStyle: { stroke: "#ffffff" } });
            if (moveCode !== OK && moveCode !== ERR_TIRED) {
                M.lNameRoleErr(cm, `move and got: ${moveCode}`);
            }
        }
        return true;
    } else {
        return false;
    }
}

/**
 * Try to build an Extension
 * @param {M.RoomMemory} rm The RoomMemory
 * @param {Creep} creep The Creep
 * @param {M.CreepMemory} cm The Creep Memory of the Builder
 * @param {Room} room The Room
 */
function tryToBuildExtension(rm: M.RoomMemory, creep: Creep, cm: M.CreepMemory, room: Room){
    // build extensions close to sources
    let closeToSource = false;
    for (const sourcePos of rm.energySources){
        const sourceRoomPos = room.getPositionAt(sourcePos.x, sourcePos.y);
        if (sourceRoomPos != null){
            const range = sourceRoomPos.getRangeTo(creep.pos);
            if (range < 12){
                M.lNameRole(cm, `Range To Source: ${range}`);
                closeToSource = true;
                break;
            }
        }
    }
    const firstSpawn = RLib.getFirstSpawn(room);
    let closeToSpawn = true;
    if (firstSpawn != null){
        closeToSpawn = false;

        // and close to spawn if spawn in room
        const range = firstSpawn.pos.getRangeTo(creep.pos);
        if (range < 6 && range > 2){
            closeToSpawn = true;
            M.lNameRole(cm, `Range To Spawn: ${range}`);
        }
    }
    if (closeToSource && closeToSpawn){
        M.lNameRole(cm, `trying to build extension`);

        let tooCloseToOther = false;
        const extensions = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }) as StructureExtension[];
        for (const extension of extensions){
            const range = extension.pos.getRangeTo(creep);
            if (range <= 1){
                M.lNameRoleErr(cm, `Too close to another extension: ${range}`);
                tooCloseToOther = true;
                break;
            }
        }
        if (!tooCloseToOther){
            const extensionConstructionSites = _.filter(RoomManager.constructionSites, (site: ConstructionSite) => site.structureType === STRUCTURE_EXTENSION);
            for (const constructionSite of extensionConstructionSites){
                const range = constructionSite.pos.getRangeTo(creep);
                if (range <= 1){
                    M.lNameRoleErr(cm, `Too close to another ext const site: ${range}`);
                    tooCloseToOther = true;
                    break;
                }
            }
        }
        if (!tooCloseToOther){
            const errCode = creep.room.createConstructionSite(creep.pos, STRUCTURE_EXTENSION);
            if (errCode === OK){
                M.lNameRole(cm, `Creep created extension at ${creep.pos}`);
                rm.buildsThisTick++;
                return;
            } else {
                M.lNameRoleErr(cm, `ERROR: created extension at ${creep.pos} ${errCode}`);
            }
        }
    }
}
