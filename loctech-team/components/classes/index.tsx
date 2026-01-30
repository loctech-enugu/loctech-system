"use client";

import { useDisclosure } from "@/hooks/use-disclosure";
import { Class } from "@/types";
import { useState } from "react";
import { ClassesTable } from "./table";
import EditClass from "./edit-class";
import CreateClass from "./create-class";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function Classes() {
  const { onOpen, onOpenChange, isOpen } = useDisclosure();
  const { onOpen: onCreateOpen, onOpenChange: onCreateOpenChange, isOpen: isCreateOpen } = useDisclosure();
  const [classItem, setClassItem] = useState<Class | null>(null);
  
  const onClassEdited = (classItem: Class) => {
    setClassItem(classItem);
    onOpen();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={onCreateOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>
      <ClassesTable onClassEdited={onClassEdited} />
      <EditClass {...{ open: isOpen, onOpenChange, classItem }} />
      <CreateClass {...{ open: isCreateOpen, onOpenChange: onCreateOpenChange }} />
    </>
  );
}

export default Classes;
