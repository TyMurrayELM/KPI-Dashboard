"use client"

// src/components/AdminPanel/HeadcountManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

// Format currency helper
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const HeadcountManagement = () => {
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState({});
  const [headcount, setHeadcount] = useState({});
  const [bonusMultiplier, setBonusMultiplier] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles with their KPIs
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select(`
          *,
          role_kpis (
            *,
            kpi:kpis (*)
          )
        `)
        .order('display_order');

      if (rolesError) throw rolesError;

      // Transform data
      const transformedPositions = {};
      const transformedHeadcount = {};

      rolesData.forEach(role => {
        const kpis = role.role_kpis
          .sort((a, b) => a.display_order - b.display_order)
          .map(rk => ({
            name: rk.kpi.name,
            target: rk.target_value,
            actual: rk.target_value, // Start at target for calculations
            weight: rk.weight,
            isInverse: rk.kpi.is_inverse
          }));

        transformedPositions[role.key] = {
          title: role.name,
          salary: role.base_salary,
          bonusPercentage: role.bonus_percentage,
          color: role.color || '#dbeafe',
          kpis: kpis
        };

        transformedHeadcount[role.key] = role.default_headcount;
      });

      setRoles(rolesData);
      setPositions(transformedPositions);
      setHeadcount(transformedHeadcount);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const calculateTotalBonus = (position) => {
    return position.salary * (position.bonusPercentage / 100);
  };

  const calculateActualTotalBonus = (position) => {
    // Simplified calculation - assumes 100% of bonus when at target
    return calculateTotalBonus(position);
  };

  const handleBonusMultiplierChange = (newMultiplier) => {
    setBonusMultiplier(parseFloat(newMultiplier) || 0);
  };

  const handleHeadcountChange = (positionKey, newCount) => {
    setHeadcount(prevHeadcount => ({
      ...prevHeadcount,
      [positionKey]: parseInt(newCount) || 0
    }));
  };

  const handleBonusPercentageChange = (positionKey, newPercentage) => {
    setPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      newPositions[positionKey] = {
        ...newPositions[positionKey],
        bonusPercentage: parseFloat(newPercentage) || 0
      };
      return newPositions;
    });
  };

  const calculateGrandTotalBonus = () => {
    return Object.keys(positions).reduce((total, positionKey) => {
      const position = positions[positionKey];
      const count = headcount[positionKey] || 0;
      const availableBonusPerPerson = calculateTotalBonus(position);
      return total + (availableBonusPerPerson * count * (bonusMultiplier / 100));
    }, 0);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
        Headcount & Financial Planning
      </h2>
      
      {/* Bonus Forecast Slider */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
          Bonus Forecast Slider
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={bonusMultiplier}
              onChange={(e) => handleBonusMultiplierChange(e.target.value)}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                accentColor: '#3b82f6'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              value={bonusMultiplier}
              onChange={(e) => handleBonusMultiplierChange(e.target.value)}
              style={{
                width: '70px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#3b82f6',
                textAlign: 'center'
              }}
              min="0"
              max="100"
              step="5"
            />
            <span style={{ color: '#3b82f6', fontSize: '16px', fontWeight: '600', marginLeft: '4px' }}>%</span>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          Adjust this slider to forecast different bonus scenarios. The percentage represents how much of the total available bonus will be paid out.
        </p>
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: '#f8fafc',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Available Bonus Budget ({bonusMultiplier}%):</span>
            <span style={{ marginLeft: '8px', fontWeight: '700', color: '#3b82f6', fontSize: '16px' }}>
              {formatCurrency(calculateGrandTotalBonus())}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>At 100%:</span>
            <span style={{ marginLeft: '8px', fontWeight: '600', color: '#1e293b', fontSize: '16px' }}>
              {formatCurrency(
                Object.keys(positions).reduce((total, positionKey) => {
                  const position = positions[positionKey];
                  const count = headcount[positionKey] || 0;
                  return total + (calculateTotalBonus(position) * count);
                }, 0)
              )}
            </span>
          </div>
        </div>
      </div>
      
      {/* Bonus Summary Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            Bonus Budget Summary
          </h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Position
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Headcount
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Bonus %
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Bonus Per Person
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Avg Salary
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Total Bonus
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13px', color: '#64748b', borderBottom: '1px solid #e5e7eb' }}>
                  Total Comp
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(positions).map((positionKey) => {
                const position = positions[positionKey];
                const count = headcount[positionKey] || 0;
                const availableBonusPerPerson = calculateTotalBonus(position);
                const forecastedBonusPerPerson = availableBonusPerPerson * (bonusMultiplier / 100);
                const forecastedTotalBonus = forecastedBonusPerPerson * count;
                const totalSalary = position.salary * count;
                const totalCompensation = totalSalary + forecastedTotalBonus;
                
                return (
                  <tr key={positionKey} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: position.color,
                          border: '1px solid #1e293b'
                        }} />
                        <span style={{ fontWeight: '500', color: '#1e293b' }}>{position.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => handleHeadcountChange(positionKey, e.target.value)}
                        style={{
                          width: '70px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '14px',
                          fontWeight: '500',
                          textAlign: 'center'
                        }}
                        min="0"
                        step="1"
                      />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input
                          type="number"
                          value={position.bonusPercentage}
                          onChange={(e) => handleBonusPercentageChange(positionKey, e.target.value)}
                          style={{
                            width: '60px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#3b82f6',
                            textAlign: 'center'
                          }}
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span style={{ color: '#3b82f6', fontWeight: '500', marginLeft: '2px' }}>%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{formatCurrency(forecastedBonusPerPerson)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        (Max: {formatCurrency(availableBonusPerPerson)})
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', color: '#1e293b' }}>
                      {formatCurrency(position.salary)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: '#3b82f6' }}>{formatCurrency(forecastedTotalBonus)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        (Max: {formatCurrency(availableBonusPerPerson * count)})
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#1e293b' }}>
                      {formatCurrency(totalCompensation)}
                    </td>
                  </tr>
                );
              })}
              
              {/* Grand Total Row */}
              <tr style={{ background: '#eff6ff' }}>
                <td colSpan="5" style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                  Grand Total:
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#3b82f6', fontSize: '16px' }}>
                    {formatCurrency(calculateGrandTotalBonus())}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    (Max: {formatCurrency(
                      Object.keys(positions).reduce((total, positionKey) => {
                        const position = positions[positionKey];
                        const count = headcount[positionKey] || 0;
                        return total + (calculateTotalBonus(position) * count);
                      }, 0)
                    )})
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#1e293b', fontSize: '16px' }}>
                  {formatCurrency(
                    Object.keys(positions).reduce((total, positionKey) => {
                      const position = positions[positionKey];
                      const count = headcount[positionKey] || 0;
                      const totalSalary = position.salary * count;
                      const forecastedTotalBonus = calculateTotalBonus(position) * count * (bonusMultiplier / 100);
                      return total + totalSalary + forecastedTotalBonus;
                    }, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HeadcountManagement;