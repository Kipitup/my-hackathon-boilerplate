import React from "react";

export function WaitingForTransactionMessage({ txHash }) {
  return (
    <div className="bg-red-300 p-2 pb-3 mt-4 mx-12 rounded" role="alert">
      Waiting for transaction <strong>{txHash}</strong> to be mined
    </div>
  );
}
