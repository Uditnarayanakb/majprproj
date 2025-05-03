import React, { useState, useEffect } from "react";
import Web3 from "web3";
import axios from "axios";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useParams, useNavigate } from "react-router-dom";

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.REACT_APP_PINATA_API_SECRET;

const UploadHR = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
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
      // Check if patient is registered
      const isRegistered = await contract.methods.isPatientRegistered(hhNumber).call();
      if (!isRegistered) {
        setError("Patient is not registered.");
        setIsLoading(false);
        return;
      }

      // 1. Upload file to Pinata (IPFS)
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        maxContentLength: "Infinity",
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
      });

      const cid = res.data.IpfsHash;

      // 2. Get accounts from MetaMask
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();

      // 3. Call smart contract to store the record
      // Use the new addPatientRecord function with IPFS hash
      await contract.methods.addPatientRecord(
        hhNumber,
        new Date().toISOString().slice(0, 10), // date
        "Uploaded Health Record",               // description
        accounts[0],                            // doctor/uploader address
        cid                                     // IPFS hash
      ).send({
        from: accounts[0],
        gas: 300000
      });

      setSuccess("File uploaded to IPFS (Pinata) and saved on blockchain!");
      setError(null);

      // 4. Redirect to Patient Dashboard
      navigate(`/patient/${hhNumber}`);
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
    navigate(-1); // Go back to previous route
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