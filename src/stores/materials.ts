import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import type { Material, MaterialDraft } from '@/types';
import { DEFAULT_MATERIAL, LIMITS, STORAGE_KEYS } from '@/utils/constants';
import { readArray, writeRecord } from '@/utils/persistence';
import { clampNumber } from '@/utils/calculations';
import { isCurrency } from '@/utils/currency';

/** `crypto.randomUUID` needs a secure context, which file:// previews are not. */
function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `material-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeDraft(draft: MaterialDraft): MaterialDraft {
  return {
    name: draft.name.trim().slice(0, LIMITS.MATERIAL_NAME_MAX_LENGTH),
    price: clampNumber(draft.price, 0, LIMITS.MATERIAL_PRICE_MAX),
    currency: draft.currency,
  };
}

function parseMaterial(entry: unknown): Material | null {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return null;
  const record = entry as Record<string, unknown>;

  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (name.length === 0) return null;

  const price = typeof record.price === 'number' && Number.isFinite(record.price) ? record.price : 0;
  const currency = isCurrency(record.currency) ? record.currency : DEFAULT_MATERIAL.currency;
  const id = typeof record.id === 'string' && record.id.length > 0 ? record.id : createId();

  return { id, ...sanitizeDraft({ name, price, currency }) };
}

function createDefaultMaterials(): Material[] {
  return [{ id: createId(), ...DEFAULT_MATERIAL }];
}

/**
 * Falls back to the seeded default whenever nothing valid is stored, so the
 * calculator always has at least one selectable filament.
 */
function loadMaterials(): Material[] {
  const stored = readArray([STORAGE_KEYS.MATERIALS]);
  if (!stored) return createDefaultMaterials();

  const parsed = stored.map(parseMaterial).filter((item): item is Material => item !== null);
  return parsed.length > 0 ? parsed : createDefaultMaterials();
}

export const useMaterialsStore = defineStore('materials', () => {
  const materials = ref<Material[]>(loadMaterials());

  watch(materials, (value) => writeRecord(STORAGE_KEYS.MATERIALS, value), { deep: true });

  const hasMaterials = computed(() => materials.value.length > 0);

  function findById(id: string | null): Material | undefined {
    if (!id) return undefined;
    return materials.value.find((material) => material.id === id);
  }

  function addMaterial(draft: MaterialDraft): Material {
    const material: Material = { id: createId(), ...sanitizeDraft(draft) };
    materials.value = [...materials.value, material];
    return material;
  }

  function updateMaterial(id: string, draft: MaterialDraft): void {
    materials.value = materials.value.map((material) =>
      material.id === id ? { id, ...sanitizeDraft(draft) } : material,
    );
  }

  function removeMaterial(id: string): void {
    materials.value = materials.value.filter((material) => material.id !== id);
  }

  return {
    materials,
    hasMaterials,
    findById,
    addMaterial,
    updateMaterial,
    removeMaterial,
  };
});
