"use client"

// src/components/AdminPanel/BonusFormulaConfig.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

const BonusFormulaConfig = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleKpis, setRoleKpis] = useState([]);
  const [selectedRoleKpi, setSelectedRoleKpi] = useState(null);
  const [formula, setFormula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  
  // Formula editing state
  const [formulaType, setFormulaType] = useState('tiered');
  const [tiers, setTiers] = useState([
    { threshold: 90, bonus_percentage: 0, comparison: 'below' },
    { threshold: 90, bonus_percentage: 50, exact_match: true },
    { threshold: 100, bonus_percentage: 100, comparison: 'above_or_equal' }
  ]);
  const [rangeRules, setRangeRules] = useState([
    { min: 90, max: 100, base_percentage: 50, additional_percentage: 50, scaling: 'proportional' }
  ]);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRoleKpis();
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedRoleKpi) {
      fetchFormula();
    }
  }, [selectedRoleKpi]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setRoles(data || []);
      
      if (data?.length > 0) {
        setSelectedRole(data[0]);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleKpis = async () => {
    try {
      const { data, error } = await supabase
        .from('role_kpis')
        .select(`
          *,
          kpi:kpis(*)
        `)
        .eq('role_id', selectedRole.id)
        .order('display_order');

      if (error) throw error;
      setRoleKpis(data || []);
      
      if (data?.length > 0) {
        setSelectedRoleKpi(data[0]);
      } else {
        setSelectedRoleKpi(null);
      }
    } catch (err) {
      console.error('Error fetching role KPIs:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const fetchFormula = async () => {
    try {
      const { data, error } = await supabase
        .from('bonus_formulas')
        .select('*')
        .eq('role_id', selectedRole.id)
        .eq('kpi_id', selectedRoleKpi.kpi_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found, which is ok

      if (data) {
        setFormula(data);
        loadFormulaIntoEditor(data.formula_config);
      } else {
        setFormula(null);
        resetEditor();
      }
    } catch (err) {
      console.error('Error fetching formula:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const loadFormulaIntoEditor = (config) => {
    setFormulaType(config.type || 'tiered');
    setTiers(config.tiers || []);
    setRangeRules(config.range_rules || []);
  };

  const resetEditor = () => {
    setFormulaType('tiered');
    setTiers([
      { threshold: 90, bonus_percentage: 0, comparison: 'below' },
      { threshold: 90, bonus_percentage: 50, exact_match: true },
      { threshold: 100, bonus_percentage: 100, comparison: 'above_or_equal' }
    ]);
    setRangeRules([
      { min: 90, max: 100, base_percentage: 50, additional_percentage: 50, scaling: 'proportional' }
    ]);
  };

  const handleSaveFormula = async () => {
    if (!selectedRoleKpi) {
      alert('Please select a KPI');
      return;
    }

    const formulaConfig = {
      type: formulaType,
      tiers: tiers,
      range_rules: rangeRules
    };

    try {
      if (formula) {
        // Update existing formula
        const { error } = await supabase
          .from('bonus_formulas')
          .update({ formula_config: formulaConfig })
          .eq('id', formula.id);

        if (error) throw error;
      } else {
        // Create new formula
        const { error } = await supabase
          .from('bonus_formulas')
          .insert([{
            role_id: selectedRole.id,
            kpi_id: selectedRoleKpi.kpi_id,
            formula_config: formulaConfig
          }]);

        if (error) throw error;
      }

      alert('Formula saved successfully!');
      setShowEditor(false);
      fetchFormula();
    } catch (err) {
      alert(`Error saving formula: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const handleDeleteFormula = async () => {
    if (!formula) return;
    
    if (!window.confirm('Delete this bonus formula?')) return;

    try {
      const { error } = await supabase
        .from('bonus_formulas')
        .delete()
        .eq('id', formula.id);

      if (error) throw error;

      alert('Formula deleted successfully!');
      setFormula(null);
      resetEditor();
    } catch (err) {
      alert(`Error deleting formula: ${err.message}`);
      console.error('Error:', err);
    }
  };

  const addTier = () => {
    setTiers([...tiers, { threshold: 0, bonus_percentage: 0, comparison: 'equal' }]);
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    if (field === 'exact_match') {
      newTiers[index][field] = value;
    } else {
      newTiers[index][field] = field.includes('percentage') || field === 'threshold' 
        ? parseFloat(value) || 0 
        : value;
    }
    setTiers(newTiers);
  };

  const removeTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const addRangeRule = () => {
    setRangeRules([...rangeRules, { 
      min: 0, 
      max: 100, 
      base_percentage: 0, 
      additional_percentage: 100, 
      scaling: 'proportional' 
    }]);
  };

  const updateRangeRule = (index, field, value) => {
    const newRules = [...rangeRules];
    newRules[index][field] = field === 'scaling' 
      ? value 
      : parseFloat(value) || 0;
    setRangeRules(newRules);
  };

  const removeRangeRule = (index) => {
    setRangeRules(rangeRules.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
        Bonus Formula Configuration
      </h2>

      {/* Role Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '15px' }}>
          Select Role:
        </label>
        <select
          value={selectedRole?.id || ''}
          onChange={(e) => {
            const role = roles.find(r => r.id === e.target.value);
            setSelectedRole(role);
            setShowEditor(false);
          }}
          style={{
            padding: '10px 16px',
            fontSize: '15px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            minWidth: '300px',
            background: 'white'
          }}
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>

      {/* KPI Selector */}
      {selectedRole && roleKpis.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '15px' }}>
            Select KPI:
          </label>
          <select
            value={selectedRoleKpi?.id || ''}
            onChange={(e) => {
              const rk = roleKpis.find(rk => rk.id === e.target.value);
              setSelectedRoleKpi(rk);
              setShowEditor(false);
            }}
            style={{
              padding: '10px 16px',
              fontSize: '15px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              minWidth: '400px',
              background: 'white'
            }}
          >
            {roleKpis.map(rk => (
              <option key={rk.id} value={rk.id}>
                {rk.kpi?.name} (Target: {rk.target_value})
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedRole && roleKpis.length === 0 && (
        <div style={{ padding: '20px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', marginBottom: '24px' }}>
          No KPIs assigned to this role. Please assign KPIs first in the "Assign KPIs to Roles" tab.
        </div>
      )}

      {/* Current Formula Display / Editor */}
      {selectedRoleKpi && (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
              Formula for: {selectedRoleKpi.kpi?.name}
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!showEditor && (
                <>
                  <button
                    onClick={() => setShowEditor(true)}
                    style={{
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    {formula ? 'Edit Formula' : 'Create Formula'}
                  </button>
                  {formula && (
                    <button
                      onClick={handleDeleteFormula}
                      style={{
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {!showEditor && formula && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Type:</strong> {formula.formula_config.type}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Configuration:</strong>
                <pre style={{ 
                  background: '#f9fafb', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  fontSize: '13px',
                  overflow: 'auto',
                  marginTop: '8px'
                }}>
                  {JSON.stringify(formula.formula_config, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!showEditor && !formula && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              No formula configured for this KPI. Click "Create Formula" to add one.
            </div>
          )}

          {/* Formula Editor */}
          {showEditor && (
            <div>
              {/* Formula Type */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Formula Type:
                </label>
                <select
                  value={formulaType}
                  onChange={(e) => setFormulaType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="tiered">Tiered (normal)</option>
                  <option value="inverse_tiered">Inverse Tiered (lower is better)</option>
                  <option value="linear">Linear</option>
                  <option value="inverse_linear">Inverse Linear</option>
                </select>
              </div>

              {/* Tiers Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600' }}>Threshold Tiers</h4>
                  <button
                    onClick={addTier}
                    style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Tier
                  </button>
                </div>

                {tiers.map((tier, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 120px 150px 80px 40px',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Threshold
                      </label>
                      <input
                        type="number"
                        value={tier.threshold}
                        onChange={(e) => updateTier(index, 'threshold', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Bonus %
                      </label>
                      <input
                        type="number"
                        value={tier.bonus_percentage}
                        onChange={(e) => updateTier(index, 'bonus_percentage', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Comparison
                      </label>
                      <select
                        value={tier.exact_match ? 'exact' : tier.comparison || 'equal'}
                        onChange={(e) => {
                          if (e.target.value === 'exact') {
                            updateTier(index, 'exact_match', true);
                            const newTiers = [...tiers];
                            delete newTiers[index].comparison;
                            setTiers(newTiers);
                          } else {
                            const newTiers = [...tiers];
                            delete newTiers[index].exact_match;
                            setTiers(newTiers);
                            updateTier(index, 'comparison', e.target.value);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <option value="exact">Exact Match</option>
                        <option value="below">Below</option>
                        <option value="above">Above</option>
                        <option value="below_or_equal">Below or Equal</option>
                        <option value="above_or_equal">Above or Equal</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => removeTier(index)}
                        style={{
                          padding: '6px',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          color: '#991b1b',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Range Rules Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600' }}>Range Rules (Interpolation)</h4>
                  <button
                    onClick={addRangeRule}
                    style={{
                      padding: '6px 12px',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add Range
                  </button>
                </div>

                {rangeRules.map((rule, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 100px 100px 120px 150px 40px',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Min
                      </label>
                      <input
                        type="number"
                        value={rule.min}
                        onChange={(e) => updateRangeRule(index, 'min', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Max
                      </label>
                      <input
                        type="number"
                        value={rule.max}
                        onChange={(e) => updateRangeRule(index, 'max', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Base %
                      </label>
                      <input
                        type="number"
                        value={rule.base_percentage}
                        onChange={(e) => updateRangeRule(index, 'base_percentage', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Additional %
                      </label>
                      <input
                        type="number"
                        value={rule.additional_percentage}
                        onChange={(e) => updateRangeRule(index, 'additional_percentage', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Scaling
                      </label>
                      <select
                        value={rule.scaling}
                        onChange={(e) => updateRangeRule(index, 'scaling', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      >
                        <option value="proportional">Proportional</option>
                        <option value="proportional_inverse">Proportional Inverse</option>
                        <option value="linear">Linear</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => removeRangeRule(index)}
                        style={{
                          padding: '6px',
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          color: '#991b1b',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={handleSaveFormula}
                  style={{
                    padding: '10px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Save Formula
                </button>
                <button
                  onClick={() => {
                    setShowEditor(false);
                    if (formula) {
                      loadFormulaIntoEditor(formula.formula_config);
                    } else {
                      resetEditor();
                    }
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BonusFormulaConfig;