/* eslint-disable @typescript-eslint/no-unused-vars */
import Select, { Props } from "react-select";
import type {} from "react-select/base";

// This import is necessary for module augmentation.
// It allows us to extend the 'Props' interface in the 'react-select/base' module
// and add our custom property 'label' to it.

declare module "react-select/base" {
  export interface Props<
    Option,
    IsMulti extends boolean,
    Group extends GroupBase<Option>,
  > {
    label?: string;
  }
}
interface GroupBase<Option> {
  readonly options: readonly Option[];
  readonly label?: string;
}

function CustomSelect<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: Props<Option, IsMulti, Group>) {
  return (
    <div className="w-full">
      {props.label != null && (
        <div className="label">
          <span className="label-text">
            {props.label}{" "}
            {props.required && <span className="text-red-600">*</span>}
          </span>
        </div>
      )}
      <Select
        {...props}
        closeMenuOnSelect={props.isMulti === undefined ? true : !props.isMulti}
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            borderRadius: 8,
          }),
          option: (styles, { isDisabled, isFocused, isSelected }) => {
            return {
              ...styles,
              backgroundColor: isSelected
                ? "#12005f"
                : isFocused
                  ? "rgba(255, 168, 21, 0.5)"
                  : undefined,
              color: isSelected ? "#000" : isFocused ? "#000" : undefined,
              cursor: isDisabled ? "not-allowed" : "pointer",

              ":active": {
                ...styles[":active"],
                backgroundColor: isSelected ? "#12005f" : undefined,
              },
            };
          },
          menu: (baseStyles, state) => ({
            ...baseStyles,
            zIndex: 8903834,
          }),
        }}
        classNames={{
          control: (state) =>
            "dark:!bg-card dark:border-[#a6adbb]/20 dark:text-gray-200 h-full custom-select",
          container: (state) => "",
          singleValue: (state) => "!text-primary-foreground !hover:bg-primary",
          menuList: (state) => "dark:!bg-card dark:text-gray-200",
          multiValue: (state) => "!bg-primary !text-primary-foreground",
          multiValueRemove: (state) => "dark:text-red-500",
          input: (state) => "dark:text-gray-200",
          placeholder: () => "text-sm",
        }}
      />
    </div>
  );
}

export default CustomSelect;
