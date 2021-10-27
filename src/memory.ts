// Memory and other Thimngs
export const enum CreepRoles {
    ROLE_UNASSINGED = 0,
    ROLE_ALL,
    ROLE_WORKER,
    ROLE_MINER,
    ROLE_MINERHAULER,
    ROLE_HEALER,
    ROLE_FIGHTER,
    ROLE_RANGER,
    ROLE_CLAIMER,
    ROLE_REMOTEMINER,
    ROLE_REMOTEHAULER,
    ROLE_CUSTOMCONTROL,
    ROLE_UPGRADER,
    ROLE_UPGRADETRANSPORT
}

/**
 *
 * @param job The Role the Creep is assigned
 * @returns The Role as String
 */
export function roleToString(job: CreepRoles): string {
    switch(job){
        case CreepRoles.ROLE_WORKER: return 'ROLE_WORKER';
        case CreepRoles.ROLE_MINER: return 'ROLE_MINER';
        case CreepRoles.ROLE_MINERHAULER: return 'ROLE_MINERHAULER';
        case CreepRoles.ROLE_HEALER: return 'ROLE_HEALER';
        case CreepRoles.ROLE_FIGHTER: return 'ROLE_FIGHTER';
        case CreepRoles.ROLE_RANGER: return 'ROLE_RANGER';
        case CreepRoles.ROLE_CLAIMER: return 'ROLE_CLAIMER';
        case CreepRoles.ROLE_REMOTEMINER: return 'ROLE_REMOTEMINER';
        case CreepRoles.ROLE_ALL: return 'ROLE_ALL';
        case CreepRoles.ROLE_CUSTOMCONTROL: return 'ROLE_CUSTOMCONTROL';
        case CreepRoles.ROLE_UPGRADER: return 'ROLE_UPGRADER';
        case CreepRoles.ROLE_UPGRADETRANSPORT: return 'ROLE_UPGRADETRANSPORT';
        case CreepRoles.ROLE_UNASSINGED: return 'ROLE_UNASSINGED';
        case CreepRoles.ROLE_MINERHAULER: return 'ROLE_MINERHAULER';
        default: return 'unknown Role';
    }
}

export interface CreepMemory {
    role: CreepRoles;
    roleString: string;
    log: boolean;
}

/**
 *
 * @param creep The given Creep
 * @returns CreepMemory
 */
export function cm(creep: Creep): CreepMemory{
    return creep.memory as CreepMemory;
}
