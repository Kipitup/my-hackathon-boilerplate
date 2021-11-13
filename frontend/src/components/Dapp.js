import React, {useState, useEffect, useRef} from "react";

// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenArtifact from "../contracts/Token.json";
import contractAddress from "../contracts/contract-address.json";

// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Transfer } from "./Transfer";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { NoTokensMessage } from "./NoTokensMessage";

// This is the Hardhat Network id, you might change it in the hardhat.config.js
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = '1337';

// This is an error code that indicates that the user canceled a transaction
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const Dapp = () => {
  const [tokenData, setTokenData] = useState(undefined)
  const [userAddress, setUserAddress] = useState(undefined)
  const [balance, setBalance] = useState(undefined)
  const [txBeingSent, setTxBeingSent] = useState(undefined)
  const [transactionError, setTransactionError] = useState(undefined)
  const [networkError, setNetworkError] = useState(undefined)
  const token = useRef(null)


  // this will poll the data the Account balance every seconde. The interval wil
  // start when component mount and will stop at unmount.
  useEffect(() => {
    async function updateBal() {
      if (token.current) {
        const newBalance = await token.current.balanceOf(userAddress);
        setBalance(newBalance);
      }
    }

    const pollDataInterval = setInterval(() => updateBal(), 1000);

    // this will be called when component unmount.
    return () => clearInterval(pollDataInterval);
  }, [userAddress])

  const _connectWallet = async () => {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.enable();

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!_checkNetwork()) {
      return;
    }

    _initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      token.current = null
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state 
      if (newAddress === undefined) {
        return _resetState();
      }
      
      _initialize(newAddress);
    });
    
    // We reset the dapp state if the network is changed
    window.ethereum.on("networkChanged", ([networkId]) => {
      token.current = null
      _resetState();
    });
  }

  const _initialize = (selectedAddress) => {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    setUserAddress(selectedAddress);

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    _intializeEthers();
    _getTokenData();
  }

  const _intializeEthers = async () => {
    // Weinitialize ethers by creating a provider using window.ethereum
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // When, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    token.current = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      provider.getSigner(0)
    );
  }

  // The next two methods just read from the contract and store the results
  // in the component state.
  const _getTokenData = async () => {
    const name = await token.current.name();
    const symbol = await token.current.symbol();

    setTokenData({ name, symbol });
  }

  // This method sends an ethereum transaction to transfer tokens.
  const _transferTokens = async (to, amount) => {
    // Sending a transaction is a complex operation:
    //   - The user can reject it
    //   - It can fail before reaching the ethereum network (i.e. if the user
    //     doesn't have ETH for paying for the tx's gas)
    //   - It has to be mined, so it isn't immediately confirmed.
    //     Note that some testing networks, like Hardhat Network, do mine
    //     transactions immediately, but your dapp should be prepared for
    //     other networks.
    //   - It can fail once mined.

    try {
      // If a transaction fails, we save that error in the component's state.
      // We only save one such error, so before sending a second transaction, we
      // clear it.
      _dismissTransactionError();

      // We send the transaction, and save its hash in the Dapp's state. This
      // way we can indicate that we are waiting for it to be mined.
      const tx = await token.current.transfer(to, amount);
      setTxBeingSent(tx.hash);

      // We use .wait() to wait for the transaction to be mined. This method
      // returns the transaction's receipt.
      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transaction failed");
      }
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      setTransactionError(error);
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      setTxBeingSent(undefined);
    }
  }

  // This method just clears part of the state.
  const _dismissTransactionError = () => {
    setTransactionError(undefined);
  }

  // This method just clears part of the state.
  const _dismissNetworkError = () => {
    setNetworkError(undefined);
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  const _getRpcErrorMessage = (error) => {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  const _resetState = () => {
    setTokenData(undefined)
    setUserAddress(undefined)
    setBalance(undefined)
    setTxBeingSent(undefined)
    setTransactionError(undefined)
    setNetworkError(undefined)
  }

  // This method checks if Metamask selected network is Localhost:8545 
  const _checkNetwork = () => {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    setNetworkError('Please connect Metamask to Localhost:8545');

    return false;
  }

  // Ethereum wallets inject the window.ethereum object. If it hasn't been
  // injected, we instruct the user to install MetaMask.
  if (window.ethereum === undefined) {
    return <NoWalletDetected />;
  }

  if (!userAddress) {
    return (
      <ConnectWallet 
        connectWallet={() => _connectWallet()} 
        networkError={networkError}
        dismiss={() => _dismissNetworkError()}
      />
    );
  }

  // If the token data or the user's balance hasn't loaded yet, we show
  // a loading component.
  if (!tokenData || !balance) {
    return <Loading />;
  }

  // If everything is loaded, we render the application.
  return (
    <div className="container p-4">
      <div className="row">
        <div className="col-12">
          <h1>
            {tokenData.name} ({tokenData.symbol})
          </h1>
          <p>
            Welcome <b>{userAddress}</b>, you have{" "}
            <b>
              {balance.toString()} {tokenData.symbol}
            </b>
            .
          </p>
        </div>
      </div>

      <hr />

      <div className="row">
        <div className="col-12">
          {/* 
            Sending a transaction isn't an immidiate action. You have to wait
            for it to be mined.
            If we are waiting for one, we show a message here.
          */}
          {txBeingSent && (
            <WaitingForTransactionMessage txHash={txBeingSent} />
          )}

          {/* 
            Sending a transaction can fail in multiple ways. 
            If that happened, we show a message here.
          */}
          {transactionError && (
            <TransactionErrorMessage
              message={_getRpcErrorMessage(transactionError)}
              dismiss={() => _dismissTransactionError()}
            />
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          {/*
            If the user has no tokens, we don't show the Tranfer form
          */}
          {balance.eq(0) && (
            <NoTokensMessage userAddress={userAddress} />
          )}

          {/*
            This component displays a form that the user can use to send a 
            transaction and transfer some tokens.
            The component doesn't have logic, it just calls the transferTokens
            callback.
          */}
          {balance.gt(0) && (
            <Transfer
              transferTokens={(to, amount) =>
                _transferTokens(to, amount)
              }
              tokenSymbol={tokenData.symbol}
            />
          )}
        </div>
      </div>
    </div>
  );

}

export {Dapp};
