import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import './index.scss'

const baseClass = 'before-dashboard'

/**
 * Chamber OS admin dashboard welcome banner.
 * Shown above the default Payload dashboard after login.
 */
const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Chamber OS Dashboard</h4>
      </Banner>
      <p>
        Welcome to your Chamber website admin. Use the navigation on the left to manage pages,
        events, news posts, and site settings.
      </p>
    </div>
  )
}

export default BeforeDashboard
