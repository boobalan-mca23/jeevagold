
import React, { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_SERVER_URL } from "../../Config/Config";
import "./jobcardreport.css";


const JobcardReport = () => {
  const [allJobCards, setAllJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    const fetchAllJobCardsData = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_SERVER_URL}/api/job-cards/job-cards`
        );
        setAllJobCards(response.data);
      } catch (err) {
        console.error("Failed to fetch all job card data:", err);
        setError("Failed to load all job card reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllJobCardsData();
  }, []);

  const calculatePurityWeight = (weight, touch) => {
    const givenWeight = parseFloat(weight) || 0;
    const touchValue = parseFloat(touch) || 0;
    return (givenWeight * touchValue) / 100;
  };

  const calculateJobCardTotals = (jobCard) => {
    let totalGivenWeight = 0;
    let totalFinalWeight = 0;
    let totalWastage = 0;
    let totalStone = 0;
    let totalEnamel = 0;
    let totalBeads = 0;

    jobCard.items.forEach((item) => {
      totalGivenWeight += calculatePurityWeight(
        item.originalGivenWeight,
        item.touch
      );
      totalFinalWeight += parseFloat(item.finalWeight || 0);
      totalWastage += parseFloat(item.wastage || 0);

      const stoneWeight =
        item.additionalWeights?.find((aw) => aw.name === "stone")?.weight || 0;
      const enamelWeight =
        item.additionalWeights?.find((aw) => aw.name === "enamel")?.weight || 0;
      const beadsWeight =
        item.additionalWeights?.find((aw) => aw.name === "beeds")?.weight || 0;

      totalStone += parseFloat(stoneWeight);
      totalEnamel += parseFloat(enamelWeight);
      totalBeads += parseFloat(beadsWeight);
    });

    const balance = totalGivenWeight - (totalFinalWeight + totalWastage);

    return {
      totalGivenWeight: totalGivenWeight.toFixed(2),
      totalFinalWeight: totalFinalWeight.toFixed(2),
      totalWastage: totalWastage.toFixed(2),
      totalStone: totalStone.toFixed(2),
      totalEnamel: totalEnamel.toFixed(2),
      totalBeads: totalBeads.toFixed(2),
      balance: balance.toFixed(2),
      balanceColor: balance > 0 ? "green" : balance < 0 ? "red" : "blue",
    };
  };

  const toggleExpandCard = (jobCardId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [jobCardId]: !prev[jobCardId],
    }));
  };


  if (loading) {
    return <p className="loading-message">Loading all job card reports...</p>;
  }

  if (error) {
    return <p className="error-message">Error: {error}</p>;
  }

  if (allJobCards.length === 0) {
    return <p className="no-data-message">No job cards found.</p>;
  }

  return (
    <div className="jobcard-report-container">
      <h2 className="report-title">Job Card Reports</h2>

      <div className="legend">
        <strong>Legend:</strong>{" "}
        <span style={{ color: "green" }}>
          Green = Goldsmith should give balance to Owner
        </span>
        ,{" "}
        <span style={{ color: "red" }}>
          Red = Owner should give balance to Goldsmith
        </span>
      </div>

      <div className="table-responsive">
        <table className="jobcard-report-table">
          <thead>
            <tr>
              <th></th>
              <th>SI.No</th>
              <th>Date</th>
              <th>Goldsmith Name</th>
              <th>Items Count</th>
              <th>Total Given Weight</th>
              <th>Total Final Weight</th>
              <th>Total Stone</th>
              <th>Total Enamel</th>
              <th>Total Beads</th>
              <th>Total Wastage</th>
              <th>Balance</th>
            
            </tr>
          </thead>
          <tbody>
            {allJobCards.map((jobCard, index) => {
              const totals = calculateJobCardTotals(jobCard);
              const isExpanded = expandedCards[jobCard.id];

              return (
                <React.Fragment key={jobCard.id}>
             
                  <tr className="jobcard-main-row">
                    <td>
                      <button
                        className="expand-btn"
                        onClick={() => toggleExpandCard(jobCard.id)}
                      >
                        {isExpanded ? "▼" : "►"}
                      </button>
                    </td>
                    <td>{index + 1}</td>
                    <td>
                      {new Date(jobCard.date).toISOString().split("T")[0]}
                    </td>
                    <td>{jobCard.goldsmith?.name || "N/A"}</td>
                    <td>{jobCard.items.length} items</td>
                    <td>{totals.totalGivenWeight} g</td>
                    <td>{totals.totalFinalWeight} g</td>
                    <td>{totals.totalStone} g</td>
                    <td>{totals.totalEnamel} g</td>
                    <td>{totals.totalBeads} g</td>
                    <td>{totals.totalWastage} g</td>
                    <td
                      style={{
                        color: totals.balanceColor,
                        fontWeight: "bold",
                      }}
                    >
                      {totals.balance} g
                    </td>
                   
                  </tr>

                  {isExpanded &&
                    jobCard.items.map((item, itemIndex) => {
                      const givenPurityWeight = calculatePurityWeight(
                        item.originalGivenWeight,
                        item.touch
                      );
                      const finalWeight = parseFloat(item.finalWeight || 0);
                      const wastage = parseFloat(item.wastage || 0);
                      const balance =
                        givenPurityWeight - (finalWeight + wastage);

                      const stoneWeight =
                        item.additionalWeights?.find(
                          (aw) => aw.name === "stone"
                        )?.weight || 0;
                      const enamelWeight =
                        item.additionalWeights?.find(
                          (aw) => aw.name === "enamel"
                        )?.weight || 0;
                      const beadsWeight =
                        item.additionalWeights?.find(
                          (aw) => aw.name === "beeds"
                        )?.weight || 0;

                      return (
                        <tr
                          key={`${jobCard.id}-${item.id || itemIndex}`}
                          className="item-detail-row"
                        >
                          <td></td>
                          <td>
                            {index + 1}.{itemIndex + 1}
                          </td>
                          <td colSpan="2">
                            {item.masterItem?.itemName || "N/A"}
                          </td>
                          <td>{item.originalGivenWeight} g</td>
                          <td>{item.touch}</td>
                          <td>{givenPurityWeight.toFixed(2)} g</td>
                          <td>{finalWeight.toFixed(2)} g</td>
                          <td>{stoneWeight} g</td>
                          <td>{enamelWeight} g</td>
                          <td>{beadsWeight} g</td>
                          <td>{wastage.toFixed(2)} g</td>
                          <td
                            style={{
                              color:
                                balance > 0
                                  ? "green"
                                  : balance < 0
                                  ? "red"
                                  : "blue",
                              fontWeight: "bold",
                            }}
                          >
                            {balance.toFixed(2)} g
                          </td>
                          <td></td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default JobcardReport;