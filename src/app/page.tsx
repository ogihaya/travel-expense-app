'use client';

import { useState } from "react";
import { Person } from "@/app/types/deta";
import AddPeople from "@/app/componets/AddPeople";
import AddMoneyRebalance from "@/app/componets/AddMoneyRebalance";
import CalculationResult from "@/app/componets/CalculationResult";

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  return (
    <div>
      <AddPeople people={people} setPeople={setPeople} />
      <AddMoneyRebalance people={people} />
      <CalculationResult />
    </div>
  );
}
