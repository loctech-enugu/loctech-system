"use client"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ComboSelectProps<T extends Record<string, any>> {
    items: T[]
    placeholder?: string
    valueKey?: keyof T
    displayKey?: keyof T
    onSelect?: (item: T) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ComboSelect<T extends Record<string, any>>({
    items,
    placeholder = "Select an item",
    valueKey = "id" as keyof T,
    displayKey = "name" as keyof T,
    onSelect,
    value,
}: ComboSelectProps<T>) {
    const selectedValue = value ?? null;

    const itemToStringLabel = (itemValue: unknown) => {
        const item = items.find((i) => i[valueKey] === itemValue);
        return item != null ? String(item[displayKey]) : String(itemValue ?? "");
    };

    const isItemEqualToValue = (itemVal: unknown, selectedVal: unknown) =>
        itemVal === selectedVal;

    const handleValueChange = (newValue: unknown) => {
        const item = items.find((i) => i[valueKey] === newValue);
        if (item) onSelect?.(item);
    };

    return (
        <Combobox
            items={items}
            value={selectedValue}
            onValueChange={handleValueChange}
            itemToStringLabel={itemToStringLabel}
            isItemEqualToValue={isItemEqualToValue}
        >
            <ComboboxInput placeholder={placeholder} />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem
                            key={String(item[valueKey])}
                            value={item[valueKey]}
                            onSelect={() => onSelect?.(item)}
                        >
                            {String(item[displayKey])}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}
