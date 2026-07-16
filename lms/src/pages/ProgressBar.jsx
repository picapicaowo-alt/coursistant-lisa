import PropTypes from 'prop-types';

function ProgressBar({ step }) {
  const steps = [1, 2, 3, 4];
  
  return (
    <div className="flex items-center gap-2 mb-6 justify-center">
      {steps.map((s) => (
        <div
          key={s}
          className={`w-24 h-2 rounded ${
            step === s ? 'bg-[#566FE8]' : 'bg-[#EDF2F7]'
          }`}
        />
      ))}
    </div>
  );
}

ProgressBar.propTypes = {
  step: PropTypes.number.isRequired,
};

export default ProgressBar;