import * as React from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { childCategories, getCategory } from "@/lib/domain/categories";

/**
 * Category picker grouped by top-level category. Pass `groups` to limit which
 * top-level categories appear (e.g. only "savings" for savings items).
 */
export function CategorySelect({
  groups,
  allowEmpty,
  emptyLabel = "No category",
  ...props
}: React.ComponentProps<"select"> & { groups: readonly string[]; allowEmpty?: boolean; emptyLabel?: string }) {
  return (
    <NativeSelect {...props}>
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {groups.map((groupId) => {
        const group = getCategory(groupId);
        if (!group) return null;
        const children = childCategories(groupId);
        return (
          <optgroup key={groupId} label={group.name}>
            <option value={group.id}>{children.length ? `${group.name} (general)` : group.name}</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </NativeSelect>
  );
}
