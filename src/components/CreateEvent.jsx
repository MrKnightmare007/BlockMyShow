import React, { useState } from 'react';

const CreateEvent = ({ createEvent }) => {
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    maxTickets: '',
    date: '',
    time: '',
    location: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createEvent(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white p-6 brutalist-card">
      <h2 className="text-2xl font-bold mb-8 font-mono">CREATE NEW EVENT</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="brutalist-container">
          <input
            type="text"
            name="name"
            placeholder="EVENT NAME"
            value={formData.name}
            onChange={handleChange}
            className="brutalist-input smooth-type"
            required
          />
          <label className="brutalist-label">EVENT NAME</label>
        </div>
        
        <div className="brutalist-container">
          <input
            type="number"
            name="cost"
            placeholder="COST IN ETH"
            value={formData.cost}
            onChange={handleChange}
            step="0.001"
            className="brutalist-input smooth-type"
            required
          />
          <label className="brutalist-label">COST (ETH)</label>
        </div>
        
        <div className="brutalist-container">
          <input
            type="number"
            name="maxTickets"
            placeholder="MAX TICKETS"
            value={formData.maxTickets}
            onChange={handleChange}
            className="brutalist-input smooth-type"
            required
          />
          <label className="brutalist-label">MAX TICKETS</label>
        </div>
        
        <div className="brutalist-container">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="brutalist-input smooth-type"
            required
          />
          <label className="brutalist-label">DATE</label>
        </div>
        
        <div className="brutalist-container">
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="brutalist-input smooth-type"
            required
          />
          <label className="brutalist-label">TIME</label>
        </div>
        
        <div className="brutalist-container">
          <input
            type="text"
            name="location"
            placeholder="LOCATION"
            value={formData.location}
            onChange={handleChange}
            className="brutalist-input smooth-type"
            required
          />
          <label className="brutalist-label">LOCATION</label>
        </div>
        
        <button
          type="submit"
          className="w-full font-mono text-lg py-4 mt-8 brutalist-button"
        >
          CREATE EVENT
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;