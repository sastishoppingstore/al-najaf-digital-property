import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, User, Home, Heart, MessageSquare, Stamp, Calendar, FileText, Bell, Mail, Settings,
  TrendingUp, Eye, Clock, Check, ChevronRight, Upload, Camera, Lock, Shield, Plus, Save,
  Package, ClipboardList, Star, Edit2, Trash2, RotateCcw, Search, Database, Scale, Building2,
  Phone, Mail as MailIcon, MessageCircle, AlertCircle, X, Filter
} from 'lucide-react';
import { useLang } from '@/lib/i18n';
import { Reveal } from '@/lib/useScrollReveal';
import { formatPKR } from '@/data/mock';
import { getSession, getCurrentUser, getFavorites, getInquiries, getAllProperties, getMyOrders, getMyInquiries, useDataVersion, type Order } from '@/lib/dataService';

type MenuId = 'overview' | 'profile' | 'orders' | 'listings' | 'saved' | 'inquiries' | 'estamp' | 'fard' | 'legal' | 'bookings' | 'documents' | 'security' | 'notifications' | 'messages' | 'settings';

export function DashboardPage() {
  const { t } = useLang();
  const [active, setActive] = useState<MenuId>('overview');

  const menu = [
    { id: 'overview' as MenuId, label: t('dash.overview'), icon: LayoutDashboard },
    { id: 'profile' as MenuId, label: t('dash.profile'), icon: User },
    { id: 'orders' as MenuId, label: t('dash.myOrders'), icon: Package },
    { id: 'listings' as MenuId, label: t('dash.myListings'), icon: Home },
    { id: 'saved' as MenuId, label: t('dash.savedProperties'), icon: Heart },
    { id: 'inquiries' as MenuId, label: t('dash.myInquiries'), icon: MessageSquare },
    { id: 'estamp' as MenuId, label: 'E-Stamp', icon: Stamp },
    { id: 'fard' as MenuId, label: 'Fard Records', icon: Database },
    { id: 'legal' as MenuId, label: 'Legal Docs', icon: Scale },
    { id: 'bookings' as MenuId, label: t('dash.myBookings'), icon: Calendar },
    { id: 'documents' as MenuId, label: t('dash.myDocuments'), icon: FileText },
    { id: 'security' as MenuId, label: t('dash.security'), icon: Shield },
    { id: 'notifications' as MenuId, label: t('dash.notifications'), icon: Bell },
    { id: 'messages' as MenuId, label: t('dash.messages'), icon: Mail },
    { id: 'settings' as MenuId, label: t('dash.settings'), icon: Settings },
  ];

  const session = getSession();
  const currentUser = session ? getCurrentUser() : null;
  const savedIds = session ? getFavorites(session.userId) : [];
  useDataVersion();
  const allProps = getAllProperties();
  const myCustomProps = allProps.filter(p => p.seller.name === (currentUser?.name || ''));
  const myListings = [...allProps, ...myCustomProps].slice(0, 3);
  const saved = [...allProps, ...myCustomProps].filter(p => savedIds.includes(p.id));
  const myOrders = session ? getMyOrders(session.userId) : [];
  const myInquiries = session ? getMyInquiries(session.userId) : [];

  const orderIcon = (type: string) => {
    if (type.toLowerCase().includes('stamp')) return Stamp;
    if (type.toLowerCase().includes('fard')) return Database;
    if (type.toLowerCase().includes('nama')) return Scale;
    if (type.toLowerCase().includes('legal') || type.toLowerCase().includes('doc')) return FileText;
    if (type.toLowerCase().includes('booking') || type.toLowerCase().includes('service')) return Calendar;
    return Package;
  };

  const estampOrders = myOrders.filter(o => o.orderType.toLowerCase().includes('stamp'));
  const fardOrders = myOrders.filter(o => o.orderType.toLowerCase().includes('fard'));
  const legalOrders = myOrders.filter(o => o.orderType.toLowerCase().includes('nama') || o.orderType.toLowerCase().includes('legal'));
  const serviceOrders = myOrders.filter(o => o.orderType.toLowerCase().includes('booking') || o.orderType.toLowerCase().includes('service'));

  const notifications = [
    { icon: Eye, text: 'Your listing "5 Marla House in DHA" got 24 new views', time: '2 hours ago', type: 'view' },
    { icon: MessageSquare, text: 'New inquiry on "1 Kanal Luxury House"', time: '5 hours ago', type: 'inquiry' },
    { icon: Stamp, text: 'E-Stamp application #EST-2024-001 is under review', time: '1 day ago', type: 'estamp' },
    { icon: Check, text: 'Fard record search completed for property #FR-2024-004', time: '1 day ago', type: 'fard' },
    { icon: Check, text: 'Your listing "Commercial Shop" was approved', time: '2 days ago', type: 'listing' },
  ];

  const messages = [
    { name: 'Admin Team', msg: 'Your E-Stamp certificate is ready for download', time: '3 hours ago', unread: true },
    { name: 'Ali Raza', msg: 'Thanks for the information. I will visit tomorrow.', time: '1 day ago', unread: false },
    { name: 'Support', msg: 'Your fard record search has been completed', time: '2 days ago', unread: false },
  ];

  const statusStyles: Record<string, string> = {
    'Under Review': 'bg-amber-100 text-amber-700',
    'Completed': 'bg-emerald-100 text-emerald-700',
    'Confirmed': 'bg-blue-100 text-blue-700',
    'Approved': 'bg-emerald-100 text-emerald-700',
    'Processing': 'bg-amber-100 text-amber-700',
    'Pending': 'bg-gray-100 text-gray-700',
    'Cancelled': 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-navy-800 sm:text-3xl">{t('dash.title')}</h1>
        <p className="mt-1 text-sm text-navy-500">{t('dash.welcome')}, {currentUser?.name || 'Guest'}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-24 md:self-start">
          <div className="rounded-2xl border border-navy-100 bg-white p-3">
            {menu.map((m) => (
              <button
                key={m.id}
                onClick={() => setActive(m.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === m.id ? 'bg-navy-700 text-white' : 'text-navy-600 hover:bg-navy-50'}`}
              >
                <m.icon className="h-4 w-4" /> {m.label}
              </button>
            ))}
          </div>
        </aside>

        <div>
          {active === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Home className="h-5 w-5" />} label={t('dash.activeListings')} value="3" color="navy" />
                <StatCard icon={<MessageSquare className="h-5 w-5" />} label={t('dash.totalInquiries')} value="12" color="gold" />
                <StatCard icon={<Heart className="h-5 w-5" />} label={t('dash.savedProps')} value="5" color="rose" />
                <StatCard icon={<Clock className="h-5 w-5" />} label={t('dash.pendingApps')} value="2" color="amber" />
              </div>

              <Reveal>
                <Card title={t('dash.recentActivity')}>
                  <div className="space-y-3">
                    {notifications.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 border-b border-navy-50 pb-3 last:border-0 last:pb-0">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600"><a.icon className="h-4 w-4" /></span>
                        <div className="flex-1">
                          <p className="text-sm text-navy-700">{a.text}</p>
                          <p className="text-xs text-navy-400">{a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>

              <Reveal>
                <Card title={t('dash.myListings')}>
                  <div className="space-y-3">
                    {myListings.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                        <img src={p.images[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                        <div className="flex-1">
                          <Link to={`/property/${p.id}`} className="font-medium text-navy-800 hover:text-gold-600">{p.title}</Link>
                          <p className="text-xs text-navy-400">{p.area}, {p.city}</p>
                          <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-navy-300" />
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>
            </div>
          )}

          {active === 'profile' && (
            <div className="space-y-4">
              <Reveal>
                <Card title={t('dash.profile')}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-20 w-20">
                      <div className="h-full w-full rounded-full border-2 border-navy-100 bg-navy-50 flex items-center justify-center text-2xl font-bold text-navy-500">{(currentUser?.name?.charAt(0) || 'U').toUpperCase()}</div>
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-navy-800">{currentUser?.name || 'User'}</h3>
                      <p className="text-sm text-navy-500">{currentUser?.email || '—'}</p>
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{currentUser?.role || 'user'}</span>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField label={t('dash.name')} value={currentUser?.name || ''} />
                    <ProfileField label={t('dash.email')} value={currentUser?.email || ''} />
                    <ProfileField label={t('dash.phone')} value={currentUser?.phone || ''} />
                    <ProfileField label={t('dash.city')} value={currentUser?.city || ''} />
                    <ProfileField label="CNIC" value={currentUser?.cnic || ''} />
                    <ProfileField label="Role" value={currentUser?.role || ''} />
                  </div>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Save className="h-4 w-4" /> {t('dash.save')}</button>
                </Card>
              </Reveal>

              <Reveal>
                <Card title={t('dash.changePassword')}>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">Current Password</label>
                      <input type="password" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">New Password</label>
                      <input type="password" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy-700">Confirm New Password</label>
                      <input type="password" className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><Lock className="h-4 w-4" /> {t('dash.updatePassword')}</button>
                  </div>
                </Card>
              </Reveal>
            </div>
          )}

          {active === 'orders' && (
            <Reveal>
              <Card title={t('dash.myOrders')}>
                {myOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-navy-400">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((o) => {
                      const Icon = orderIcon(o.orderType);
                      return (
                        <div key={o.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                          <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600"><Icon className="h-5 w-5" /></span>
                          <div className="flex-1">
                            <p className="font-medium text-navy-800">{o.orderType} — {o.orderRef}</p>
                            <p className="text-xs text-navy-400">{o.orderDate || new Date(o.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Reveal>
          )}

          {active === 'listings' && (
            <Reveal>
              <Card title={t('dash.myListings')}>
                <div className="space-y-3">
                  {myListings.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                      <img src={p.images[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                      <div className="flex-1">
                        <Link to={`/property/${p.id}`} className="font-medium text-navy-800 hover:text-gold-600">{p.title}</Link>
                        <p className="text-xs text-navy-400">{p.area}, {p.city} · Rs {formatPKR(p.price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-100 flex items-center gap-1"><Edit2 className="h-3 w-3" /> Edit</button>
                        <button className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/post-ad" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><Plus className="h-4 w-4" /> {t('nav.postAd')}</Link>
              </Card>
            </Reveal>
          )}

          {active === 'saved' && (
            <Reveal>
              <Card title={t('dash.savedProperties')}>
                <div className="space-y-3">
                  {saved.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                      <img src={p.images[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                      <div className="flex-1">
                        <Link to={`/property/${p.id}`} className="font-medium text-navy-800 hover:text-gold-600">{p.title}</Link>
                        <p className="text-xs text-navy-400">{p.area}, {p.city} · Rs {formatPKR(p.price)}</p>
                      </div>
                      <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                    </div>
                  ))}
                </div>
                <Link to="/properties" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"><Search className="h-4 w-4" /> Browse Properties</Link>
              </Card>
            </Reveal>
          )}

          {active === 'inquiries' && (
            <Reveal>
              <Card title={t('dash.myInquiries')}>
                <div className="space-y-3">
                  {myInquiries.length === 0 && (
                    <p className="py-8 text-center text-sm text-navy-400">No inquiries yet</p>
                  )}
                  {myInquiries.map((inq) => (
                    <div key={inq.id} className={`flex items-start gap-3 rounded-xl border p-3 ${!inq.read ? 'border-gold-200 bg-gold-50/20' : 'border-navy-50'}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${!inq.read ? 'bg-gold-100 text-gold-600' : 'bg-navy-50 text-navy-600'}`}><MessageSquare className="h-4 w-4" /></span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-800">{inq.name}</p>
                          {!inq.read && <span className="h-2 w-2 rounded-full bg-gold-400" />}
                        </div>
                        <p className="text-xs text-navy-500">Regarding: {inq.propertyTitle}</p>
                        <p className="mt-1 text-sm text-navy-600">{inq.message}</p>
                        <p className="mt-1 text-xs text-navy-400">{new Date(inq.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-100 flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Reply</button>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}

          {active === 'estamp' && (
            <Reveal>
              <Card title="E-Stamp Applications">
                {estampOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-navy-400">No E-Stamp applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {estampOrders.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold-50 text-gold-600"><Stamp className="h-5 w-5" /></span>
                        <div className="flex-1">
                          <p className="font-medium text-navy-800">{e.orderRef}</p>
                          <p className="text-xs text-navy-400">{e.orderType} · {e.orderAmount}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[e.status] || 'bg-gray-100 text-gray-700'}`}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/estamp" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300"><Plus className="h-4 w-4" /> New E-Stamp Application</Link>
              </Card>
            </Reveal>
          )}

          {active === 'fard' && (
            <Reveal>
              <Card title="Fard Record Requests">
                {fardOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-navy-400">No Fard record requests yet</p>
                ) : (
                  <div className="space-y-3">
                    {fardOrders.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600"><Database className="h-5 w-5" /></span>
                        <div className="flex-1">
                          <p className="font-medium text-navy-800">{f.orderRef}</p>
                          <p className="text-xs text-navy-400">{f.orderType}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[f.status] || 'bg-gray-100 text-gray-700'}`}>{f.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/fard" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> New Fard Record Search</Link>
              </Card>
            </Reveal>
          )}

          {active === 'legal' && (
            <Reveal>
              <Card title="Legal Document Requests">
                {legalOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-navy-400">No legal document requests yet</p>
                ) : (
                  <div className="space-y-3">
                    {legalOrders.map((l) => (
                      <div key={l.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-purple-50 text-purple-600"><Scale className="h-5 w-5" /></span>
                        <div className="flex-1">
                          <p className="font-medium text-navy-800">{l.orderRef}</p>
                          <p className="text-xs text-navy-400">{l.orderType}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[l.status] || 'bg-gray-100 text-gray-700'}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/legal" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"><Plus className="h-4 w-4" /> New Legal Document</Link>
              </Card>
            </Reveal>
          )}

          {active === 'bookings' && (
            <Reveal>
              <Card title={t('dash.myBookings')}>
                {serviceOrders.length === 0 ? (
                  <p className="py-8 text-center text-sm text-navy-400">No service bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {serviceOrders.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 rounded-xl border border-navy-50 p-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600"><Calendar className="h-5 w-5" /></span>
                        <div className="flex-1">
                          <p className="font-medium text-navy-800">{b.orderRef} · {b.orderType}</p>
                          <p className="text-xs text-navy-400">{b.orderDate || new Date(b.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link to="/services" className="mt-4 inline-flex items-center gap-2 rounded-xl border border-navy-200 px-5 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50"><Plus className="h-4 w-4" /> Book New Service</Link>
              </Card>
            </Reveal>
          )}

          {active === 'documents' && (
            <Reveal>
              <Card title={t('dash.myDocuments')}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { name: 'CNIC Copy (Front)', status: 'Uploaded', size: '245 KB' },
                    { name: 'CNIC Copy (Back)', status: 'Uploaded', size: '230 KB' },
                    { name: 'Property Documents', status: 'Pending', size: '—' },
                    { name: 'E-Stamp Certificate', status: 'Available', size: '1.2 MB' },
                  ].map((d, i) => (
                    <div key={i} className="rounded-xl border border-navy-50 p-3 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600"><FileText className="h-5 w-5" /></span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-navy-800">{d.name}</p>
                        <p className="text-xs text-navy-400">{d.size}</p>
                      </div>
                      <span className={`text-xs font-medium ${d.status === 'Uploaded' || d.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}

          {active === 'security' && (
            <Reveal>
              <Card title={t('dash.security')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-navy-50 p-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-navy-800">Two-Factor Authentication</p>
                        <p className="text-xs text-navy-400">Add extra security to your account</p>
                      </div>
                    </div>
                    <button className="rounded-lg bg-navy-700 px-4 py-1.5 text-xs font-semibold text-white">Enable</button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-navy-50 p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gold-500" />
                      <div>
                        <p className="font-medium text-navy-800">Email Notifications</p>
                        <p className="text-xs text-navy-400">Receive alerts for account activity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 font-medium">Active</span>
                      <button className="h-5 w-10 rounded-full bg-emerald-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-navy-50 p-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-rose-500" />
                      <div>
                        <p className="font-medium text-navy-800">Last Password Change</p>
                        <p className="text-xs text-navy-400">30 days ago</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-navy-200 px-4 py-1.5 text-xs font-medium text-navy-600">Change</button>
                  </div>
                </div>
              </Card>
            </Reveal>
          )}

          {active === 'notifications' && (
            <Reveal>
              <Card title={t('dash.notifications')}>
                <div className="space-y-3">
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-navy-50 pb-3 last:border-0 last:pb-0">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600"><n.icon className="h-4 w-4" /></span>
                      <div className="flex-1">
                        <p className="text-sm text-navy-700">{n.text}</p>
                        <p className="text-xs text-navy-400">{n.time}</p>
                      </div>
                      <button className="text-navy-300 hover:text-navy-500"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}

          {active === 'messages' && (
            <Reveal>
              <Card title={t('dash.messages')}>
                <div className="space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${m.unread ? 'border-gold-200 bg-gold-50/20' : 'border-navy-50'}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${m.unread ? 'bg-gold-100 text-gold-600' : 'bg-navy-50 text-navy-600'}`}>
                        {m.name.charAt(0)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-800">{m.name}</p>
                          {m.unread && <span className="h-2 w-2 rounded-full bg-gold-400" />}
                        </div>
                        <p className="text-sm text-navy-600">{m.msg}</p>
                        <p className="text-xs text-navy-400">{m.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}

          {active === 'settings' && (
            <Reveal>
              <Card title={t('dash.settings')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-navy-800">Language</p>
                      <p className="text-xs text-navy-400">Change interface language</p>
                    </div>
                    <select className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm outline-none">
                      <option>English</option>
                      <option>Urdu</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-navy-50">
                    <div>
                      <p className="font-medium text-navy-800">Currency</p>
                      <p className="text-xs text-navy-400">Display currency for prices</p>
                    </div>
                    <select className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm outline-none">
                      <option>PKR (Rs.)</option>
                      <option>USD ($)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-navy-50">
                    <div>
                      <p className="font-medium text-navy-800">Distance Unit</p>
                      <p className="text-xs text-navy-400">Property size measurement</p>
                    </div>
                    <select className="rounded-lg border border-navy-100 px-3 py-1.5 text-sm outline-none">
                      <option>Marla / Kanal</option>
                      <option>Sq. Ft.</option>
                      <option>Sq. Yd.</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-navy-50">
                    <div>
                      <p className="font-medium text-navy-800">Email Notifications</p>
                      <p className="text-xs text-navy-400">Receive email updates</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-5 w-10 rounded-full bg-navy-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-emerald-400 peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-t border-navy-50">
                    <div>
                      <p className="font-medium text-navy-800">SMS Notifications</p>
                      <p className="text-xs text-navy-400">Receive SMS updates</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked className="peer sr-only" />
                      <div className="h-5 w-10 rounded-full bg-navy-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:bg-emerald-400 peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                </div>
                <button className="mt-6 rounded-xl bg-gold-400 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-gold-300">Save Settings</button>
              </Card>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    navy: 'bg-navy-50 text-navy-700',
    gold: 'bg-gold-50 text-gold-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="card-3d border border-navy-100/60 p-4">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[color]}`}>{icon}</span>
      <div className="mt-3 text-2xl font-bold text-navy-800">{value}</div>
      <div className="text-xs text-navy-500">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-serif text-lg font-bold text-navy-800">{title}</h2>
      {children}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <input defaultValue={value} className="w-full rounded-xl border border-navy-100 px-3 py-2 text-sm outline-none focus:border-gold-400" />
    </div>
  );
}
