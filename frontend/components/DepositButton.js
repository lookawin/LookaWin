import { useDeposit, DepositModal } from "@particle-network/universal-deposit/react";

export default function DepositButton({ address, lang, isOpen, onClose }) {
  useDeposit({ ownerAddress: address || "" });
  return (
    <DepositModal isOpen={isOpen} onClose={onClose} />
  );
}
