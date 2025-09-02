import React from 'react';

interface AstrologerProps {
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  price: number;
  image: string;
}

const AstrologerCard: React.FC<AstrologerProps> = ({
  name,
  specialty,
  experience,
  rating,
  price,
  image
}) => {
  return (
    <div className="card h-100 text-center border-0 shadow-sm" style={{transition: 'box-shadow 0.3s ease'}}>
      <div className="card-body p-3">
        {/* Profile Image */}
        <div className="position-relative mb-3">
          <img
            src={image}
            alt={name}
            className="rounded-circle mx-auto d-block"
            style={{width: '80px', height: '80px', objectFit: 'cover'}}
          />
          <div className="position-absolute bg-success text-white text-center rounded px-2 py-1" 
               style={{fontSize: '10px', bottom: '-8px', left: '50%', transform: 'translateX(-50%)'}}>
            Online
          </div>
        </div>

        {/* Name and Specialty */}
        <h6 className="card-title font-weight-bold text-dark mb-1" style={{fontSize: '14px'}}>{name}</h6>
        <p className="text-primary font-weight-medium mb-1" style={{fontSize: '12px'}}>{specialty}</p>
        
        {/* Experience */}
        <p className="text-muted mb-2" style={{fontSize: '11px'}}>{experience}</p>

        {/* Rating */}
        <div className="d-flex align-items-center justify-content-center mb-2">
          <span className="text-warning mr-1" style={{fontSize: '16px'}}>★</span>
          <span className="font-weight-medium" style={{fontSize: '13px'}}>{rating}</span>
        </div>

        {/* Price */}
        <div className="text-dark font-weight-bold mb-3" style={{fontSize: '16px'}}>₹{price}/min</div>

        {/* Action Buttons */}
        <div className="d-flex flex-column">
          <button className="btn btn-primary btn-sm mb-2 d-flex align-items-center justify-content-center" style={{fontSize: '11px'}}>
            <span className="mr-1">📞</span>
            Call
          </button>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center" style={{fontSize: '11px'}}>
            <span className="mr-1">💬</span>
            Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AstrologerCard;