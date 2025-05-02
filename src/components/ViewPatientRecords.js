import React, { useState, useEffect } from "react";
import Web3 from "web3";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import NavBar_Logout from "./NavBar_Logout";
import { useParams } from "react-router-dom";

function ViewPatientRecords() {
  const { hhNumber } = useParams(); // Retrieve the hhNumber from the URL parameter
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
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
          // Fetch patient records from the smart contract
          const records = await contractInstance.methods
            .getPatientRecords(hhNumber)
            .call();
          setPatientRecords(records);
        } catch (err) {
          console.error("Error fetching patient records:", err);
          setError("Error fetching patient records");
        }
      } else {
        console.log("Please install MetaMask extension");
        setError("Please install MetaMask extension");
      }
    };

    init();
  }, [hhNumber]);

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gradient-to-b from-black to-gray-800 text-white p-10 font-mono">
        <h1 className="text-center text-3xl mb-6">Patient Records</h1>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {patientRecords.length > 0 ? (
          <div className="space-y-4">
            {patientRecords.map((record, index) => (
              <div
                key={index}
                className="bg-gray-700 p-6 rounded-lg shadow-lg"
              >
                <p className="text-lg">
                  <strong>Record ID:</strong> {record.id}
                </p>
                <p className="text-lg">
                  <strong>Date:</strong> {record.date}
                </p>
                <p className="text-lg">
                  <strong>Description:</strong> {record.description}
                </p>
                <p className="text-lg">
                  <strong>Doctor:</strong> {record.doctor}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-xl">No records found for this patient.</p>
        )}
      </div>
    </div>
  );
}

export default ViewPatientRecords;
