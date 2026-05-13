import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccountSettings from './AccountSettings';

describe('AccountSettings legacy stub', () => {
  it('renders nothing because settings moved to Settings.jsx', () => {
    const { container } = render(<AccountSettings />);
    expect(container).toBeEmptyDOMElement();
  });
});
