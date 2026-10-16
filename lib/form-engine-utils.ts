export const parseMobileString = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  let ccLength = 0;
  if (['1', '7'].includes(digits.substring(0, 1))) ccLength = 1;
  else if (/^(2[07]|3[0-469]|4[013-9]|5[1-8]|6[0-6]|8[1246]|9[0-58])/.test(digits)) ccLength = 2;
  else if (digits.length >= 3) ccLength = 3;
  else ccLength = digits.length;
  return { digits, ccLength };
};

export const formatPhoneDisplay = (raw: string) => {
  if (!raw) return '';
  const { digits, ccLength } = parseMobileString(raw);
  if (digits.length === 0) return '';
  if (digits.length <= ccLength) return digits;
  const cc = digits.substring(0, ccLength);
  const rest = digits.substring(ccLength);
  return cc + ' ' + rest;
};

/**
 * Strictly extracts up to 8 numeric digits (0-9) from a raw or prefixed token string.
 */
export const extractTokenDigits = (raw: string, eventCode?: string) => {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  const prefix = eventCode ? `${eventCode.toUpperCase()}-` : '';
  const body = prefix && upper.startsWith(prefix) ? upper.slice(prefix.length) : upper;
  return body.replace(/\D/g, '').slice(0, 8);
};

/**
 * Formats an 8-digit token body with a readability hyphen (e.g., "1234-5678").
 */
export const formatTokenBodyDisplay = (raw: string, eventCode?: string) => {
  const digits = extractTokenDigits(raw, eventCode);
  if (digits.length > 4) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
};

/**
 * Assembles the full canonical token [EVENT_CODE]-DDDD-DDDD.
 */
export const buildFullToken = (eventCode: string, rawBody: string) => {
  const digits = extractTokenDigits(rawBody, eventCode);
  if (!digits) return '';
  if (digits.length > 4) {
    return `${eventCode}-${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return `${eventCode}-${digits}`;
};

/**
 * Evaluates field visibility based on conditional rules and active answers.
 */
export const shouldShowField = (field: any, activeAnswers: Record<string, any>): boolean => {
  if (!field.condition || !field.condition.rules || field.condition.rules.length === 0) return true;
  const { match, rules } = field.condition;

  const normalize = (val: any): any => {
    if (typeof val !== 'string') return val;
    const s = val.trim();
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return s;
  };

  const isStrictNumeric = (val: any): boolean => {
    if (typeof val === 'number') return !isNaN(val);
    if (typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (trimmed === '') return false;
    return !isNaN(Number(trimmed));
  };

  const evaluations = rules.map((rule: any) => {
    const dependentVal = activeAnswers[rule.dependsOn];
    const isEmpty =
      dependentVal === undefined ||
      dependentVal === null ||
      dependentVal === '' ||
      (Array.isArray(dependentVal) && dependentVal.length === 0);

    if (rule.operator === 'is_blank') return isEmpty;
    if (rule.operator === 'is_not_blank') return !isEmpty;

    if (isEmpty) return false;

    const normDependentVal = Array.isArray(dependentVal) ? dependentVal.map(normalize) : normalize(dependentVal);
    const normRuleVal = normalize(rule.value);

    switch (rule.operator) {
      case 'greater_than': {
        if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
          return Number(normDependentVal) > Number(normRuleVal);
        }
        return normDependentVal > normRuleVal;
      }

      case 'less_than': {
        if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
          return Number(normDependentVal) < Number(normRuleVal);
        }
        return normDependentVal < normRuleVal;
      }

      case 'within_range': {
        const [startStr, endStr] = String(normRuleVal)
          .split('..')
          .map((s: string) => normalize(s.trim()));
        if (!startStr || !endStr) return false;
        if (isStrictNumeric(normDependentVal) && isStrictNumeric(startStr) && isStrictNumeric(endStr)) {
          const num = Number(normDependentVal);
          return num >= Number(startStr) && num <= Number(endStr);
        }
        return normDependentVal >= startStr && normDependentVal <= endStr;
      }

      case 'not_within_range': {
        const [startStr, endStr] = String(normRuleVal)
          .split('..')
          .map((s: string) => normalize(s.trim()));
        if (!startStr || !endStr) return true;
        if (isStrictNumeric(normDependentVal) && isStrictNumeric(startStr) && isStrictNumeric(endStr)) {
          const num = Number(normDependentVal);
          return num < Number(startStr) || num > Number(endStr);
        }
        return normDependentVal < startStr || normDependentVal > endStr;
      }

      case 'equals': {
        if (Array.isArray(normDependentVal)) {
          return (
            normDependentVal.length === 1 &&
            (isStrictNumeric(normDependentVal[0]) && isStrictNumeric(normRuleVal)
              ? Number(normDependentVal[0]) === Number(normRuleVal)
              : normDependentVal[0] === normRuleVal)
          );
        }
        if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
          return Number(normDependentVal) === Number(normRuleVal);
        }
        return normDependentVal === normRuleVal;
      }

      case 'not_equals': {
        if (Array.isArray(normDependentVal)) {
          return (
            normDependentVal.length !== 1 ||
            (isStrictNumeric(normDependentVal[0]) && isStrictNumeric(normRuleVal)
              ? Number(normDependentVal[0]) !== Number(normRuleVal)
              : normDependentVal[0] !== normRuleVal)
          );
        }
        if (isStrictNumeric(normDependentVal) && isStrictNumeric(normRuleVal)) {
          return Number(normDependentVal) !== Number(normRuleVal);
        }
        return normDependentVal !== normRuleVal;
      }

      case 'contains':
        return Array.isArray(normDependentVal)
          ? normDependentVal.includes(normRuleVal)
          : typeof normDependentVal === 'string'
          ? normDependentVal.toLowerCase().includes(String(normRuleVal).toLowerCase())
          : false;

      case 'not_contains':
        return Array.isArray(normDependentVal)
          ? !normDependentVal.includes(normRuleVal)
          : typeof normDependentVal === 'string'
          ? !normDependentVal.toLowerCase().includes(String(normRuleVal).toLowerCase())
          : false;

      case 'is_one_of': {
        const allowed = (
          Array.isArray(rule.value) ? rule.value : typeof rule.value === 'string' ? rule.value.split(',') : []
        ).map((v: string) => normalize(v.trim()));
        return Array.isArray(normDependentVal)
          ? normDependentVal.some((val: string) => allowed.includes(val))
          : allowed.includes(normDependentVal);
      }

      case 'is_not_one_of': {
        const disallowed = (
          Array.isArray(rule.value) ? rule.value : typeof rule.value === 'string' ? rule.value.split(',') : []
        ).map((v: string) => normalize(v.trim()));
        return Array.isArray(normDependentVal)
          ? !normDependentVal.some((val: string) => disallowed.includes(val))
          : !disallowed.includes(normDependentVal);
      }

      default:
        return true;
    }
  });

  return match === 'OR' ? evaluations.some(Boolean) : evaluations.every(Boolean);
};