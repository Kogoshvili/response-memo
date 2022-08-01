import React from 'react';
import PropTypes from 'prop-types';

function Button({ children, type = 'primary', onClick, disabled = false, size = 'm', className = '' }) {
    return (
        <div className="Button">
            <button
                className={`btn btn-${type} btn-${size} ${className}`}
                onClick={onClick}
                disabled={disabled}
            >{children}</button>
        </div>
    );
}

Button.propTypes = {
    children: PropTypes.string,
    type: PropTypes.string,
    onClick: PropTypes.func,
    size: PropTypes.string,
    disabled: PropTypes.bool,
    className: PropTypes.string
};

export default Button;
