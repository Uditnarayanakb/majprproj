import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { create as ipfsHttpClient } from "ipfs-http-client";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useParams } from "react-router-dom";

const ipfs = ipfsHttpClient({ url: "https://ipfs.io" }); // Or use Infura

const UploadHR = () => {
  const { hhNumber } = useParams(); // Get patient HH number from URL
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      } else {
        setError("Please install MetaMask extension");
      }
    };
    init();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!contract || !web3) {
      setError("Web3 or contract not initialized.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Upload file to IPFS
      const added = await ipfs.add(file);
      const ipfsHash = added.path;

      // 2. Get accounts from MetaMask
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();

      // 3. Call smart contract to store the record
      // Replace 'uploadRecord' with your actual method name and arguments
      await contract.methods.uploadRecord(hhNumber, ipfsHash).send({ from: accounts[0] });

      setSuccess("File uploaded to IPFS and saved on blockchain!");
      setError(null);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("An error occurred while uploading the file.");
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono h-screen flex flex-col justify-center items-center">
      <h2 className="text-3xl font-bold mb-6">Upload Your Past Records</h2>
      <div className="w-full max-w-md bg-gray-700 p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-lg font-bold mb-2">Choose File:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full text-white bg-gray-800 border border-gray-600 rounded-lg p-2"
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <div className="flex justify-between">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-300 disabled:bg-gray-500"
          >
            {isLoading ? "Uploading..." : "Submit"}
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadHR;