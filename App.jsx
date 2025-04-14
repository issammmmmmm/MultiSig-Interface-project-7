import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI } from "./abi/multisig";

const contractAddress = "0x899e5393C3Bc352a5402F86D7ee087654Adb02c2";

function App() {
  const [wallet, setWallet] = useState(null);
  const [contract, setContract] = useState(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);

  const connectWallet = async () => {
    const [address] = await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const instance = new ethers.Contract(contractAddress, contractABI, signer);
    setWallet(address);
    setContract(instance);
  };

  const submitTransaction = async () => {
    if (!contract || !to || !amount) return;
    const tx = await contract.submitTransaction(to, ethers.parseEther(amount));
    await tx.wait();
    loadTransactions();
  };

  const confirmTransaction = async (index) => {
    if (!contract) return;
    const tx = await contract.confirmTransaction(index);
    await tx.wait();
    loadTransactions();
  };

  const loadTransactions = async () => {
    if (!contract) return;
    const txs = [];
    let index = 0;
    while (true) {
      try {
        const tx = await contract.transactions(index);
        txs.push({ ...tx, index });
        index++;
      } catch {
        break;
      }
    }
    setTransactions(txs);
  };

  useEffect(() => {
    if (contract) {
      loadTransactions();
    }
  }, [contract]);

  return (
    <div className="App" style={{ padding: "20px" }}>
      <h1>🧾 Multi-Sig Wallet</h1>
      {!wallet ? (
        <button onClick={connectWallet}>🔐 Connect Wallet</button>
      ) : (
        <>
          <p>Connected: {wallet}</p>

          <h3>Submit Transaction</h3>
          <input
            type="text"
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={submitTransaction}>📤 Submit</button>

          <h3 style={{ marginTop: "30px" }}>Pending Transactions</h3>
          {transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            <ul>
              {transactions.map((tx) => (
                <li key={tx.index}>
                  #{tx.index} → {tx.to} : {ethers.formatEther(tx.value)} ETH | Confirmations: {tx.confirmations.toString()} | {tx.executed ? "✅ Executed" : "⏳ Pending"}
                  {!tx.executed && <button onClick={() => confirmTransaction(tx.index)}>✅ Confirm</button>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default App;
