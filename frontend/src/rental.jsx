import React, { useState } from 'react';

function RentalForm() {
    const [area, setArea] = useState('');
    const [rentPrice, setRentPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleApiCall = async (area, rentPrice) => {
        setLoading(true);
        setMessage('');
        try {
            const response = await fetch("http://localhost:3000/api/rentals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ area, rentPrice }),
            });
            if (!response.ok) throw new Error("Failed to save rental data");
            const data = await response.json();
            setMessage("Rental data saved successfully!");
            console.log(data);
        } catch (error) {
            setMessage("Failed to save rental data. Please try again.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!area.trim() || rentPrice <= 0) {
            setMessage("Please fill out all fields with valid data.");
            return;
        }
        handleApiCall(area, rentPrice);
        setArea('');
        setRentPrice('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="area">Area</label>
                <input
                    id="area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="rentPrice">Rent Price</label>
                <input
                    id="rentPrice"
                    type="number"
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    required
                    min="1"
                />
            </div>
            <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
            </button>
            {message && <p>{message}</p>}
        </form>
    );
}

export default RentalForm;