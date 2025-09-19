import AddPeople from "@/app/componets/AddPeople";
import AddMoneyRebalance from "@/app/componets/AddMoneyRebalance";
import CalculationResult from "@/app/componets/CalculationResult";

export default function Home() {
  return (
    <div>
      <AddPeople />
      <AddMoneyRebalance />
      <CalculationResult />
    </div>
  );
}
