'use client'

import React, { useMemo, useState } from 'react'

type Option = {
  id: number | string
  name: string
}

interface Props {
  tiers: Option[]
  organizations: Option[]
  people: Option[]
}

type Mode = 'organization' | 'individual'
type OrgMode = 'create' | 'select'
type PrimaryMode = 'create' | 'select' | 'none'

/**
 * Staff-assisted onboarding panel with two flows:
 * 1) Organization member (create/select org, create/select primary contact)
 * 2) Individual member shortcut
 */
export function MemberOnboardingPanel({ tiers, organizations, people }: Props) {
  const [mode, setMode] = useState<Mode>('organization')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Organization flow state
  const [orgMode, setOrgMode] = useState<OrgMode>('create')
  const [primaryMode, setPrimaryMode] = useState<PrimaryMode>('create')
  const [orgContactId, setOrgContactId] = useState<string>('')
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [orgPhone, setOrgPhone] = useState('')
  const [primaryContactId, setPrimaryContactId] = useState<string>('')
  const [primaryContactName, setPrimaryContactName] = useState('')
  const [primaryContactEmail, setPrimaryContactEmail] = useState('')
  const [primaryContactPhone, setPrimaryContactPhone] = useState('')

  // Individual flow state
  const [individualName, setIndividualName] = useState('')
  const [individualEmail, setIndividualEmail] = useState('')
  const [individualPhone, setIndividualPhone] = useState('')

  const [tierId, setTierId] = useState<string>('')

  const canSubmitOrg = useMemo(() => {
    if (orgMode === 'create' && !orgName.trim()) return false
    if (orgMode === 'select' && !orgContactId) return false
    if (primaryMode === 'create' && !primaryContactName.trim()) return false
    if (primaryMode === 'select' && !primaryContactId) return false
    return true
  }, [orgMode, orgName, orgContactId, primaryMode, primaryContactName, primaryContactId])

  const canSubmitIndividual = individualName.trim().length > 0

  async function submitOrganization(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmitOrg) return

    setBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/staff/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'organization',
          orgMode,
          orgContactId: orgMode === 'select' ? Number(orgContactId) : undefined,
          orgName: orgMode === 'create' ? orgName : undefined,
          orgEmail: orgMode === 'create' ? orgEmail || undefined : undefined,
          orgPhone: orgMode === 'create' ? orgPhone || undefined : undefined,
          primaryMode,
          primaryContactId: primaryMode === 'select' ? Number(primaryContactId) : undefined,
          primaryContactName: primaryMode === 'create' ? primaryContactName : undefined,
          primaryContactEmail: primaryMode === 'create' ? primaryContactEmail || undefined : undefined,
          primaryContactPhone: primaryMode === 'create' ? primaryContactPhone || undefined : undefined,
          membershipTierId: tierId ? Number(tierId) : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const json = (await res.json()) as { result: { memberId: number | string } }
      setSuccess(`Organization member onboarded. Member ID: ${json.result.memberId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
    } finally {
      setBusy(false)
    }
  }

  async function submitIndividual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmitIndividual) return

    setBusy(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/staff/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'individual',
          name: individualName,
          email: individualEmail || undefined,
          phone: individualPhone || undefined,
          membershipTierId: tierId ? Number(tierId) : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      const json = (await res.json()) as { result: { memberId: number | string } }
      setSuccess(`Individual member onboarded. Member ID: ${json.result.memberId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chamber-dashboard__panel chamber-dashboard__panel--onboarding">
      <div className="chamber-dashboard__panel-header">
        <h3>Staff Onboarding</h3>
        <a href="/admin/collections/members" className="chamber-dashboard__view-all">
          Members →
        </a>
      </div>

      <div className="chamber-dashboard__onboarding-mode">
        <button
          type="button"
          className={mode === 'organization' ? 'is-active' : ''}
          onClick={() => setMode('organization')}
        >
          New Organization Member
        </button>
        <button
          type="button"
          className={mode === 'individual' ? 'is-active' : ''}
          onClick={() => setMode('individual')}
        >
          New Individual Member
        </button>
      </div>

      {mode === 'organization' ? (
        <form className="chamber-dashboard__onboarding-form" onSubmit={submitOrganization}>
          <label>
            Organization source
            <select value={orgMode} onChange={(e) => setOrgMode(e.target.value as OrgMode)}>
              <option value="create">Create new organization contact</option>
              <option value="select">Select existing organization contact</option>
            </select>
          </label>

          {orgMode === 'create' ? (
            <>
              <label>
                Organization name
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </label>
              <label>
                Organization email
                <input value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} type="email" />
              </label>
              <label>
                Organization phone
                <input value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} />
              </label>
            </>
          ) : (
            <label>
              Existing organization contact
              <select value={orgContactId} onChange={(e) => setOrgContactId(e.target.value)} required>
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={String(org.id)} value={String(org.id)}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Primary contact
            <select
              value={primaryMode}
              onChange={(e) => setPrimaryMode(e.target.value as PrimaryMode)}
            >
              <option value="create">Create new primary contact</option>
              <option value="select">Select existing person contact</option>
              <option value="none">No primary contact</option>
            </select>
          </label>

          {primaryMode === 'create' && (
            <>
              <label>
                Primary contact name
                <input
                  value={primaryContactName}
                  onChange={(e) => setPrimaryContactName(e.target.value)}
                  required
                />
              </label>
              <label>
                Primary contact email
                <input
                  value={primaryContactEmail}
                  onChange={(e) => setPrimaryContactEmail(e.target.value)}
                  type="email"
                />
              </label>
              <label>
                Primary contact phone
                <input
                  value={primaryContactPhone}
                  onChange={(e) => setPrimaryContactPhone(e.target.value)}
                />
              </label>
            </>
          )}

          {primaryMode === 'select' && (
            <label>
              Existing person contact
              <select
                value={primaryContactId}
                onChange={(e) => setPrimaryContactId(e.target.value)}
                required
              >
                <option value="">Select a person contact</option>
                {people.map((person) => (
                  <option key={String(person.id)} value={String(person.id)}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Membership tier
            <select value={tierId} onChange={(e) => setTierId(e.target.value)}>
              <option value="">No tier yet</option>
              {tiers.map((tier) => (
                <option key={String(tier.id)} value={String(tier.id)}>
                  {tier.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={busy || !canSubmitOrg}>
            {busy ? 'Submitting...' : 'Create Organization Member'}
          </button>
        </form>
      ) : (
        <form className="chamber-dashboard__onboarding-form" onSubmit={submitIndividual}>
          <label>
            Full name
            <input
              value={individualName}
              onChange={(e) => setIndividualName(e.target.value)}
              required
            />
          </label>
          <label>
            Email
            <input
              value={individualEmail}
              onChange={(e) => setIndividualEmail(e.target.value)}
              type="email"
            />
          </label>
          <label>
            Phone
            <input value={individualPhone} onChange={(e) => setIndividualPhone(e.target.value)} />
          </label>
          <label>
            Membership tier
            <select value={tierId} onChange={(e) => setTierId(e.target.value)}>
              <option value="">No tier yet</option>
              {tiers.map((tier) => (
                <option key={String(tier.id)} value={String(tier.id)}>
                  {tier.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy || !canSubmitIndividual}>
            {busy ? 'Submitting...' : 'Create Individual Member'}
          </button>
        </form>
      )}

      {error && <p className="chamber-dashboard__onboarding-message is-error">{error}</p>}
      {success && <p className="chamber-dashboard__onboarding-message is-success">{success}</p>}
    </div>
  )
}
