
'use client';

import {
  visitorTypes as initialVisitorTypes,
  vehicleVisitorTypes as initialVehicleVisitorTypes,
  vehicleTypes as initialVehicleTypes,
  vehicleBrands as initialVehicleBrands,
  vehicleColors as initialVehicleColors,
  equipment as initialEquipment,
  incidentCategories as initialIncidentCategories,
  providerTypes as initialProviderTypes,
  employeeTypes as initialEmployeeTypes
} from './data';

export const listKeys = [
    'visitorTypes', 
    'vehicleVisitorTypes', 
    'vehicleTypes', 
    'vehicleBrands', 
    'vehicleColors',
    'equipment',
    'incidentCategories',
    'providerTypes',
    'employeeTypes'
] as const;

export type ListKey = typeof listKeys[number];

const initialDataMap: Record<ListKey, string[]> = {
    visitorTypes: initialVisitorTypes,
    vehicleVisitorTypes: initialVehicleVisitorTypes,
    vehicleTypes: initialVehicleTypes,
    vehicleBrands: initialVehicleBrands,
    vehicleColors: initialVehicleColors,
    equipment: initialEquipment,
    incidentCategories: initialIncidentCategories,
    providerTypes: initialProviderTypes,
    employeeTypes: initialEmployeeTypes,
};

function getFromStorage(key: ListKey): string[] {
    if (typeof window === 'undefined') {
        return initialDataMap[key];
    }
    try {
        const storedData = localStorage.getItem(`list-${key}`);
        if (storedData && storedData !== 'undefined' && storedData !== 'null') {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Failed to parse from localStorage key "list-${key}", re-initializing.`, error);
    }
    localStorage.setItem(`list-${key}`, JSON.stringify(initialDataMap[key]));
    return initialDataMap[key];
}

function saveToStorage(key: ListKey, data: string[]) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(`list-${key}`, JSON.stringify(data.sort()));
    }
}

export function getList(key: ListKey): string[] {
    return getFromStorage(key);
}

export function updateList(key: ListKey, newList: string[]): void {
    saveToStorage(key, newList);
}
