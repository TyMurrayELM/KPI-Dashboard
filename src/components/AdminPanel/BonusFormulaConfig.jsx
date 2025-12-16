"use client"

// src/components/AdminPanel/BonusFormulaConfig.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

// Common formula templates
const FORMULA_TEMPLATES = [
  {
    name: "Standard (90% threshold)",
    description: "No bonus below 90%, 50% at 90%, scales to 100% at target",
    tiers: [
      { threshold: 90, bonus_percentage: 0, comparison: 'below' },
      { threshold: 90, bonus_percentage: 50, exact_match: true },
      { threshold: 100, bonus_percentage: 100, comparison: 'above_or_equal' }
    ],
    range_rules: [
      { min: 90, max: 100, base_percentage: 50, additional_percentage: 50, scaling: 'proportional' }
    ]
  },
  {
    name: "Custom Threshold (e.g., 70%)",
    description: "No bonus below 70%, 50% at 70%, scales to 100% at 80%",
    tiers: [
      { threshold: 70, bonus_percentage: 0, comparison: 'below' },
      { threshold: 70, bonus_percentage: 50, exact_match: true },
      { threshold: 80, bonus_percentage: 100, comparison: 'above_or_equal' }
    ],
    range_rules: [
      { min: 70, max: 80, base_percentage: 50, additional_percentage: 50, scaling: 'proportional' }
    ]
  },
  {
    name: "Linear (Simple)",
    description: "Bonus scales linearly from 0% to 100% based on achievement",
    tiers: [
      { threshold: 0, bonus_percentage: 0, comparison: 'below' },
      { threshold: 100, bonus_percentage: 100, comparison: 'above_or_equal' }
    ],
    range_rules: [
      { min: 0, max: 100, base_percentage: 0, additional_percentage: 100, scaling: 'proportional' }
    ]
  },
  {
    name: "Inverse (Lower is Better)",
    description: "For metrics like labor costs where lower is better",
    tiers: [
      { threshold: 40, bonus_percentage: 0, comparison: 'above' },
      { threshold: 40, bonus_percentage: 50, exact_match: true },
      { threshold: 38, bonus_percentage: 100, comparison: 'below_or_equal' }
    ],
    range_rules: [
      { min: 38, max: 40, base_percentage: 50, additional_percentage: 50, scaling: 'proportional_inverse' }
    ]
  },
  {
    name: "All or Nothing",
    description: "0% bonus below target, 100% at or above target",
    tiers: [
      { threshold: 100, bonus_percentage: 0, comparison: 'below' },
      { threshold: 100, bonus_percentage: 100, comparison: 'above_or_equal' }
    ],
    range_rules: []
  }
];

// Human-readable formula summary component
const FormulaSummary = ({ config }) => {
  const { tiers = [], range_rules = [] } = config;
  
  // Generate summary text
  const generateSummary = () => {
    const lines = [];
    
    // Sort tiers by threshold for logical ordering
    const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
    
    // Find key thresholds
    const zeroTier = sortedTiers.find(t => t.bonus_percentage === 0);
    const fiftyTier = sortedTiers.find(t => t.bonus_percentage === 50);
    const hundredTier = sortedTiers.find(t => t.bonus_percentage === 100);
    
    // Analyze the formula pattern
    if (zeroTier && zeroTier.comparison === 'below') {
      lines.push({
        icon: '🚫',
        text: `No bonus if achievement is below ${zeroTier.threshold}%`,
        color: '#dc2626'
      });
    }
    
    if (fiftyTier && fiftyTier.exact_match) {
      lines.push({
        icon: '⚡',
        text: `50% bonus when exactly at ${fiftyTier.threshold}%`,
        color: '#ca8a04'
      });
    }
    
    // Check for range rules (scaling)
    range_rules.forEach(rule => {
      const direction = rule.scaling === 'proportional_inverse' ? 'lower' : 'higher';
      const startBonus = rule.base_percentage;
      const endBonus = rule.base_percentage + rule.additional_percentage;
      
      lines.push({
        icon: '📈',
        text: `Scales from ${startBonus}% to ${endBonus}% bonus between ${rule.min}% and ${rule.max}% achievement`,
        color: '#2563eb'
      });
    });
    
    if (hundredTier) {
      const condition = hundredTier.comparison === 'above_or_equal' ? 'at or above' : 
                       hundredTier.comparison === 'above' ? 'above' : 'at';
      lines.push({
        icon: '✅',
        text: `100% bonus when ${condition} ${hundredTier.threshold}%`,
        color: '#16a34a'
      });
    }
    
    // If we couldn't parse specific patterns, show generic tier info
    if (lines.length === 0) {
      sortedTiers.forEach(tier => {
        const condition = tier.exact_match ? 'exactly' :
                         tier.comparison === 'below' ? 'below' :
                         tier.comparison === 'above' ? 'above' :
                         tier.comparison === 'below_or_equal' ? 'at or below' :
                         tier.comparison === 'above_or_equal' ? 'at or above' : '';
        lines.push({
          icon: tier.bonus_percentage === 0 ? '🚫' : tier.bonus_percentage === 100 ? '✅' : '⚡',
          text: `${tier.bonus_percentage}% bonus when ${condition} ${tier.threshold}%`,
          color: tier.bonus_percentage === 0 ? '#dc2626' : tier.bonus_percentage === 100 ? '#16a34a' : '#ca8a04'
        });
      });
    }
    
    return lines;
  };
  
  // Calculate preview values
  const calculatePreview = (value) => {
    let bonusPercentage = 0;

    for (const tier of tiers) {
      if (tier.exact_match && value === tier.threshold) {
        return tier.bonus_percentage;
      } else if (tier.comparison === 'below' && value < tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'above' && value > tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'below_or_equal' && value <= tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'above_or_equal' && value >= tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      }
    }

    for (const rule of range_rules) {
      if (value >= rule.min && value <= rule.max) {
        const progress = (value - rule.min) / (rule.max - rule.min);
        if (rule.scaling === 'proportional') {
          bonusPercentage = rule.base_percentage + (rule.additional_percentage * progress);
        } else if (rule.scaling === 'proportional_inverse') {
          bonusPercentage = rule.base_percentage + (rule.additional_percentage * (1 - progress));
        }
        break;
      }
    }

    return Math.round(bonusPercentage);
  };

  const summaryLines = generateSummary();
  
  // Get key preview values based on the formula
  const previewValues = [];
  const allThresholds = new Set([0, 50, 100]);
  tiers.forEach(t => allThresholds.add(t.threshold));
  range_rules.forEach(r => {
    allThresholds.add(r.min);
    allThresholds.add(r.max);
    allThresholds.add(Math.round((r.min + r.max) / 2)); // midpoint
  });
  
  // Sort and limit preview values
  const sortedPreviews = Array.from(allThresholds).sort((a, b) => a - b).slice(0, 8);

  return (
    <div>
      {/* Summary Box */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: '#334155'
        }}>
          How This Formula Works:
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {summaryLines.map((line, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '16px' }}>{line.icon}</span>
              <span style={{ color: line.color, fontWeight: '500' }}>{line.text}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Quick Preview */}
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h4 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: '#166534'
        }}>
          Quick Preview:
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {sortedPreviews.map(val => (
            <div key={val} style={{
              padding: '6px 12px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              textAlign: 'center',
              minWidth: '80px'
            }}>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>{val}% achieved</div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: calculatePreview(val) >= 100 ? '#16a34a' : 
                       calculatePreview(val) >= 50 ? '#ca8a04' : 
                       calculatePreview(val) > 0 ? '#ea580c' : '#dc2626'
              }}>
                {calculatePreview(val)}% bonus
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
  const [tiers, setTiers] = useState([]);
  const [rangeRules, setRangeRules] = useState([]);

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

      if (error && error.code !== 'PGRST116') throw error;

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
    setTiers([]);
    setRangeRules([]);
  };

  const applyTemplate = (template) => {
    setTiers([...template.tiers]);
    setRangeRules([...template.range_rules]);
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
        const { error } = await supabase
          .from('bonus_formulas')
          .update({ formula_config: formulaConfig })
          .eq('id', formula.id);

        if (error) throw error;
      } else {
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
    setTiers([...tiers, { threshold: 0, bonus_percentage: 0, comparison: 'below' }]);
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    if (field === 'exact_match') {
      newTiers[index][field] = value;
      if (value) {
        delete newTiers[index].comparison;
      }
    } else if (field === 'comparison') {
      newTiers[index][field] = value;
      delete newTiers[index].exact_match;
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

  // Calculate preview bonus for a given achievement value
  const calculatePreviewBonus = (achievementValue) => {
    if (tiers.length === 0 && rangeRules.length === 0) return 0;
    
    let bonusPercentage = 0;

    // Check tiers first
    for (const tier of tiers) {
      if (tier.exact_match && achievementValue === tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'below' && achievementValue < tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'above' && achievementValue > tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'below_or_equal' && achievementValue <= tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      } else if (tier.comparison === 'above_or_equal' && achievementValue >= tier.threshold) {
        bonusPercentage = tier.bonus_percentage;
        break;
      }
    }

    // Check range rules for interpolation
    for (const rule of rangeRules) {
      if (achievementValue >= rule.min && achievementValue <= rule.max) {
        const progress = (achievementValue - rule.min) / (rule.max - rule.min);
        
        if (rule.scaling === 'proportional') {
          bonusPercentage = rule.base_percentage + (rule.additional_percentage * progress);
        } else if (rule.scaling === 'proportional_inverse') {
          bonusPercentage = rule.base_percentage + (rule.additional_percentage * (1 - progress));
        }
        break;
      }
    }

    return Math.round(bonusPercentage);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
        Bonus Formula Configuration
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        Define how bonus amounts are calculated based on KPI achievement levels.
      </p>

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
              {/* Human-readable summary */}
              <FormulaSummary config={formula.formula_config} />
              
              {/* Collapsible JSON for advanced users */}
              <details style={{ marginTop: '16px' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  color: '#6b7280',
                  userSelect: 'none'
                }}>
                  View raw configuration (JSON)
                </summary>
                <pre style={{ 
                  background: '#f9fafb', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  fontSize: '12px',
                  overflow: 'auto',
                  marginTop: '8px'
                }}>
                  {JSON.stringify(formula.formula_config, null, 2)}
                </pre>
              </details>
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
              {/* Quick Start Templates */}
              <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                background: '#f0f9ff', 
                border: '1px solid #bae6fd', 
                borderRadius: '8px' 
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#0369a1' }}>
                  📋 Quick Start - Choose a Template
                </h4>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                  Click a template to auto-fill the formula, then customize as needed:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {FORMULA_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => applyTemplate(template)}
                      style={{
                        padding: '8px 12px',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      title={template.description}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* How It Works Explanation */}
              <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                background: '#fefce8', 
                border: '1px solid #fde047', 
                borderRadius: '8px' 
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#854d0e' }}>
                  💡 How Formulas Work
                </h4>
                <ul style={{ fontSize: '13px', color: '#713f12', margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '4px' }}><strong>Tiers</strong> define fixed bonus percentages at specific thresholds (e.g., "0% bonus if below 70%")</li>
                  <li style={{ marginBottom: '4px' }}><strong>Range Rules</strong> create smooth scaling between thresholds (e.g., "scale from 50% to 100% between 70-80%")</li>
                  <li>The system checks tiers first, then applies range rules for values within a range</li>
                </ul>
              </div>

              {/* Live Preview */}
              {(tiers.length > 0 || rangeRules.length > 0) && (
                <div style={{ 
                  marginBottom: '24px', 
                  padding: '16px', 
                  background: '#f0fdf4', 
                  border: '1px solid #86efac', 
                  borderRadius: '8px' 
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#166534' }}>
                    📊 Live Preview - Bonus at Different Achievement Levels
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {[0, 50, 60, 70, 75, 80, 85, 90, 95, 100].map(val => (
                      <div key={val} style={{
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '4px',
                        textAlign: 'center',
                        minWidth: '70px',
                        border: '1px solid #d1d5db'
                      }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{val}% achieved</div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: calculatePreviewBonus(val) >= 100 ? '#16a34a' : 
                                 calculatePreviewBonus(val) >= 50 ? '#ca8a04' : '#dc2626'
                        }}>
                          {calculatePreviewBonus(val)}% bonus
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tiers Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                  Define fixed bonus percentages at specific achievement levels. Use "Exact Match" for precise values, or comparisons like "below" for ranges.
                </p>

                {tiers.length === 0 && (
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '4px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    No tiers defined. Click "+ Add Tier" or choose a template above.
                  </div>
                )}

                {tiers.map((tier, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 80px 40px',
                    gap: '12px',
                    marginBottom: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '4px',
                    alignItems: 'end'
                  }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Achievement Value
                      </label>
                      <input
                        type="number"
                        value={tier.threshold}
                        onChange={(e) => updateTier(index, 'threshold', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Condition
                      </label>
                      <select
                        value={tier.exact_match ? 'exact_match' : tier.comparison || 'below'}
                        onChange={(e) => {
                          if (e.target.value === 'exact_match') {
                            updateTier(index, 'exact_match', true);
                          } else {
                            updateTier(index, 'comparison', e.target.value);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      >
                        <option value="exact_match">Exactly equals</option>
                        <option value="below">Below this value</option>
                        <option value="above">Above this value</option>
                        <option value="below_or_equal">At or below</option>
                        <option value="above_or_equal">At or above</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Bonus % Earned
                      </label>
                      <input
                        type="number"
                        value={tier.bonus_percentage}
                        onChange={(e) => updateTier(index, 'bonus_percentage', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px',
                          background: 'white'
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', paddingBottom: '8px' }}>
                      %
                    </div>
                    <div>
                      <button
                        onClick={() => removeTier(index)}
                        style={{
                          padding: '8px 12px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600' }}>Scaling Ranges</h4>
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
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                  Create smooth bonus scaling between two values. Example: "Between 70% and 80% achievement, scale bonus from 50% to 100%"
                </p>

                {rangeRules.length === 0 && (
                  <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '4px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                    No scaling ranges defined. Add one to create smooth transitions between thresholds.
                  </div>
                )}

                {rangeRules.map((rule, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(5, 1fr) 40px', 
                      gap: '12px',
                      alignItems: 'end'
                    }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                          From (Min)
                        </label>
                        <input
                          type="number"
                          value={rule.min}
                          onChange={(e) => updateRangeRule(index, 'min', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: 'white'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                          To (Max)
                        </label>
                        <input
                          type="number"
                          value={rule.max}
                          onChange={(e) => updateRangeRule(index, 'max', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: 'white'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                          Starting Bonus %
                        </label>
                        <input
                          type="number"
                          value={rule.base_percentage}
                          onChange={(e) => updateRangeRule(index, 'base_percentage', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: 'white'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                          Additional Bonus %
                        </label>
                        <input
                          type="number"
                          value={rule.additional_percentage}
                          onChange={(e) => updateRangeRule(index, 'additional_percentage', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: 'white'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                          Direction
                        </label>
                        <select
                          value={rule.scaling}
                          onChange={(e) => updateRangeRule(index, 'scaling', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: 'white'
                          }}
                        >
                          <option value="proportional">Higher = Better</option>
                          <option value="proportional_inverse">Lower = Better</option>
                        </select>
                      </div>
                      <div>
                        <button
                          onClick={() => removeRangeRule(index)}
                          style={{
                            padding: '8px 12px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                      → Between {rule.min}% and {rule.max}% achievement: bonus scales from {rule.base_percentage}% to {rule.base_percentage + rule.additional_percentage}%
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