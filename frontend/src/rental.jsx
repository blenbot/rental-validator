import React, { useState } from "react";

function RentalForm() {
    const [area, setArea] = useState("");
    const [rentPrice, setRentPrice] = useState("");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState("");

    const areaOptions = [
        "Saket",
        "Hauz Khas",
        "Punjabi Bagh",
        "Rajouri Garden",
        "Tagore Garden",
        "Paschim Vihar"
    ];

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
            setResponse(data);
        } catch (err) {
            setError(err.message || "An unexpected error occurred. Please try again.");
            console.error("API Call Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!area || rentPrice <= 0) {
            setError("Please select an area and provide a positive rent price.");
            return;
        }

        handleApiCall(area, Number(rentPrice));
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
                <select
                    id="area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    style={{
                        width: "100%",
                        padding: "0.5rem",
                        marginTop: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc"
                    }}
                >
                    <option value="">Select an area</option>
                    {areaOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
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
                    {response.meanPrice && (
                        <p>
                            <strong>Mean Price:</strong> ₹{response.meanPrice}
                        </p>
                    )}
                    {response.medianPrice && (
                        <p>
                            <strong>Median Price:</strong> ₹{response.medianPrice}
                        </p>
                    )}
                    {response.priceRange && response.priceRange.low !== null && (
                        <p>
                            <strong>Price Range:</strong> ₹{response.priceRange.low} - ₹{response.priceRange.high}
                        </p>
                    )}
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
