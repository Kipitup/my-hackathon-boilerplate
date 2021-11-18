import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="flex flex-col justify-center">
      <div className="text-center">
        {/* Metamask network should be set to Localhost:8545. */}
        {networkError && (
          <NetworkErrorMessage 
            message={networkError} 
            dismiss={dismiss} 
          />
        )}
      </div>
      <div className="p-4 text-center">
        <p>Please connect to your wallet.</p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 m-4 rounded"
          type="button"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
