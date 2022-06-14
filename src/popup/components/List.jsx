import React from 'react';
import PropTypes from 'prop-types';

function List({ list, onClick }) {
    return (
        <ul>
            {list.map((item, index) => (<li key={index} onClick={() => onClick(index)}>{item}</li>))}
        </ul>
    );
}

List.propTypes = {
    list: PropTypes.array,
    onClick: PropTypes.func
};

export default List;
