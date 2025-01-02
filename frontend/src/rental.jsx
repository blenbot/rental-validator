import React, { useState } from "react";

function RentalForm() {
    const [area, setArea] = useState("");
    const [rentPrice, setRentPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null); // Store API response
    const [error, setError] = useState(""); // Store error message

    const handleApiCall = async (area, rentPrice) => {
        setLoading(true);
        setResponse(null);
        setError("");

        try {
            const response = await fetch("http://localhost:3000/api/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ area, rentPrice }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data from the server");
            }

            const data = await response.json();
            setResponse(data); // Set the detailed API response
        } catch (err) {
            setError(err.message || "An unexpected error occurred. Please try again.");
            console.error("API Call Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!area.trim() || rentPrice <= 0) {
            setError("Please provide a valid area and a positive rent price.");
            return;
        }

        handleApiCall(area, Number(rentPrice));
        setArea("");
        setRentPrice("");
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem" }}
        >
            <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="area" style={{ display: "block", fontWeight: "bold" }}>
                    Area
                </label>
                <input
                    id="area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    placeholder="Enter the area name"
                    style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
                />
            </div>
            <div style={{ marginBottom: "1rem" }}>
                <label htmlFor="rentPrice" style={{ display: "block", fontWeight: "bold" }}>
                    Rent Price
                </label>
                <input
                    id="rentPrice"
                    type="number"
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    required
                    min="1"
                    placeholder="Enter the rent price"
                    style={{ width: "100%", padding: "0.5rem", marginTop: "0.5rem" }}
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: loading ? "#ccc" : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                }}
            >
                {loading ? "Submitting..." : "Submit"}
            </button>
            {error && (
                <p style={{ marginTop: "1rem", color: "red" }}>
                    {error}
                </p>
            )}
            {response && (
                <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
                    <p>
                        <strong>Area:</strong> {response.area}
                    </p>
                    <p>
                        <strong>Rent Price:</strong> ₹{response.rentPrice}
                    </p>
                    <p>
                        <strong>Mean Price:</strong> ₹{response.meanPrice}
                    </p>
                    <p>
                        <strong>Median Price:</strong> ₹{response.medianPrice}
                    </p>
                    <p>
                        <strong>Price Range:</strong> ₹{response.priceRange.low} - ₹{response.priceRange.high}
                    </p>
                    <p>
                        <strong>Verdict:</strong>{" "}
                        <span
                            style={{
                                color:
                                    response.verdict === "Underpriced"
                                        ? "green"
                                        : response.verdict === "Overpriced"
                                        ? "red"
                                        : "orange",
                            }}
                        >
                            {response.verdict}
                        </span>
                    </p>
                </div>
            )}
        </form>
    );
}

export default RentalForm;
