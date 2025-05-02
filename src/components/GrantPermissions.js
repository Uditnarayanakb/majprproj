import React, { useState } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useParams } from "react-router-dom";

const GrantPermissions = () => {
  const { hhNumber } = useParams(); // Patient's HH number
  const [doctorHHNumber, setDoctorHHNumber] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    setDoctorHHNumber(e.target.value);
    setError(null);
    setSuccess(null);
  };

  const handleGrantAccess = async () => {
    if (!doctorHHNumber) {
      setError("Please enter the doctor's HH number.");
      return;
    }

    try {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.requestAccounts();

        const networkId = await web3.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        const contract = new web3.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork && deployedNetwork.address
        );

        // 1. Check if doctor exists
        const isDoctor = await contract.methods.isDoctorRegistered(doctorHHNumber).call();
        console.log("Doctor exists?", isDoctor);

        if (!isDoctor) {
          setError("Doctor HH number not found.");
          return;
        }

        // 2. Grant permission
        await contract.methods.grantDoctorPermission(hhNumber, doctorHHNumber).send({
          from: accounts[0],
          gas: 200000,
        });

        setSuccess(`Access granted to doctor with HH number: ${doctorHHNumber}`);
        setError(null);
      } else {
        setError("MetaMask is not installed. Please install it to proceed.");
      }
    } catch (err) {
      console.error("Error granting access:", err);
      setError("An error occurred while granting access.");
    }
  };

  const handleCancel = () => {
    setDoctorHHNumber("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono h-screen flex flex-col justify-center items-center">
      <h2 className="text-3xl font-bold mb-6">Grant View Permission to the Doctor</h2>
      <div className="w-full max-w-md bg-gray-700 p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-lg font-bold mb-2">Doctor HH Number:</label>
          <input
            type="text"
            value={doctorHHNumber}
            onChange={handleInputChange}
            placeholder="Enter Doctor HH Number"
            className="w-full text-white bg-gray-800 border border-gray-600 rounded-lg p-2"
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <div className="flex justify-between">
          <button
            onClick={handleGrantAccess}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition duration-300"
          >
            Grant Access
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

export default GrantPermissions;