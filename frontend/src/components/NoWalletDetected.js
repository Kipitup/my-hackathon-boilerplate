import React from "react";

export function NoWalletDetected() {
  return (
      <div className="flex flex-col justify-center">
        <div className="p-4 text-center">
          <p>
            No Ethereum wallet was detected. <br />
            Please install{" "}
            <a
              href="http://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              MetaMask
            </a>
            .
          </p>
        </div>
      </div>
  );
}
