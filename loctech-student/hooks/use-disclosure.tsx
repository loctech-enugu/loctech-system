"use client";
import { useCallback, useState } from "react";

interface UseDisclosureProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onClose?(): void;
  onOpen?(): void;
  onChange?(isOpen: boolean): void;
  id?: string;
}

function useDisclosure(props: UseDisclosureProps = {}) {
  const {
    isOpen: controlledIsOpen,
    defaultOpen,
    onClose,
    onOpen,
    onChange,
  } = props;
  const isControlled = controlledIsOpen !== undefined;
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(
    defaultOpen || false
  );

  const isOpen = isControlled ? controlledIsOpen! : uncontrolledIsOpen;

  const onOpenHandler = useCallback(() => {
    if (!isControlled) setUncontrolledIsOpen(true);
    onOpen?.();
    onChange?.(true);
  }, [isControlled, onOpen, onChange]);

  const onCloseHandler = useCallback(() => {
    if (!isControlled) setUncontrolledIsOpen(false);
    onClose?.();
    onChange?.(false);
  }, [isControlled, onClose, onChange]);

  const onOpenChangeHandler = useCallback(() => {
    if (isOpen) {
      onCloseHandler();
    } else {
      onOpenHandler();
    }
  }, [isOpen, onCloseHandler, onOpenHandler]);

  const getButtonProps = (extraProps: { [key: string]: unknown } = {}) => ({
    "aria-expanded": isOpen,
    "aria-controls": props.id,
    onClick: onOpenChangeHandler,
    ...extraProps,
  });

  const getDisclosureProps = (extraProps: { [key: string]: unknown } = {}) => ({
    id: props.id,
    hidden: !isOpen,
    ...extraProps,
  });

  return {
    isOpen,
    onOpen: onOpenHandler,
    onClose: onCloseHandler,
    onOpenChange: onOpenChangeHandler,
    isControlled,
    getButtonProps,
    getDisclosureProps,
  };
}

type UseDisclosureReturn = ReturnType<typeof useDisclosure>;

export { useDisclosure, type UseDisclosureProps, type UseDisclosureReturn };
