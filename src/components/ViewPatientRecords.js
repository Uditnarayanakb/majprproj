import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBar_Logout from "./NavBar_Logout";
import { useParams, useNavigate } from "react-router-dom";

function ViewPatientRecords() {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [fileRecords, setFileRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork && deployedNetwork.address
        );
        setContract(contractInstance);

        try {
          // Fetch file records (array of CIDs) from the smart contract
          const records = await contractInstance.methods
            .getFileRecords(hhNumber)
            .call();
          setFileRecords(records);
        } catch (err) {
          console.error("Error fetching file records:", err);
          setError("Error fetching file records");
        }
      } else {
        setError("Please install MetaMask extension");
      }
    };

    init();
  }, [hhNumber]);

  // Helper to get a fake timestamp (since only CID is stored, unless you store timestamp too)
  // If you store timestamps in your contract, replace this with the actual value.
  const getFakeTimestamp = (index) => {
    // For demo: just use the current time minus index*5 minutes
    const date = new Date(Date.now() - index * 5 * 60 * 1000);
    return date.toLocaleString();
  };

  const handleDelete = async (index) => {
    if (!contract) return;
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      await contract.methods.deleteFileRecord(hhNumber, index).send({ from: accounts[0], gas: 200000 });
      // Remove from UI
      setFileRecords((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError("Error deleting file record");
      console.error(err);
    }
  };

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono min-h-screen">
        <h1 className="text-center text-3xl mb-6">Patient Uploaded Files</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {fileRecords.length > 0 ? (
          <div className="space-y-4">
            {fileRecords.map((cid, index) => (
              <div
                key={index}
                className="bg-gray-700 p-6 rounded-lg shadow-lg flex justify-between items-center"
              >
                <div>
                  <p className="text-lg font-bold">Record: {index + 1}</p>
                  <p className="text-md">Uploaded: {getFakeTimestamp(index)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-300"
                    onClick={() =>
                      window.open(`https://ipfs.io/ipfs/${cid}`, "_blank")
                    }
                  >
                    View
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xl">No uploaded files found for this patient.</p>
        )}
        <div className="flex justify-center mt-8">
          <button
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default ViewPatientRecords;
