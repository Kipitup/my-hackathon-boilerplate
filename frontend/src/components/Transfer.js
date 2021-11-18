import React from "react";

export function Transfer({ transferTokens, tokenSymbol }) {
  return (
    <div className="p-4 shadow-md rounded-md text-left">
      <h4 className="text-2xl">Transfer</h4>
      <form
        onSubmit={(event) => {
          // This function just calls the transferTokens callback with the
          // form's data.
          event.preventDefault();

          const formData = new FormData(event.target);
          const to = formData.get("to");
          const amount = formData.get("amount");

          if (to && amount) {
            transferTokens(to, amount);
          }
        }}
      >
        <div className="block mt-4">
          <label>Amount of {tokenSymbol}</label>
          <input
            className="form-input mt-1 block w-full"
            type="number"
            step="1"
            name="amount"
            placeholder="1"
            required
          />
        </div>
        <div className="block mt-4">
          <label>Recipient address</label>
          <input
            className="form-input mt-1 block w-full"
            type="text"
            name="to"
            placeholder="0x2B59.....44FB"
            required
          />
        </div>
        <div className="block mt-4">
          <input
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 m-4 rounded"
            type="submit"
            value="Transfer"
          />
        </div>
      </form>
    </div>
  );
}
