// longfellow.js

"use strict";

const longfellow = [`<p class="title">Inferno</p>
	<p class="author">Henry Wadsworth Longfellow</p>`,

	`<p class="cantohead">Inferno: Canto I</p>
	<div class="stanza">
		<p>Midway upon the journey of our life</p>
		<p class="slindent">I found myself within a forest dark,</p>
		<p class="slindent">For the straightforward pathway had been lost.</p>
	</div>
	<div class="stanza">
		<p>Ah me! how hard a thing it is to say</p>
		<p class="slindent">What was this forest savage, rough, and stern,</p>
		<p class="slindent">Which in the very thought renews the fear.</p>
	</div>
	<div class="stanza">
		<p>So bitter is it, death is little more;</p>
		<p class="slindent">But of the good to treat, which there I found,</p>
		<p class="slindent">Speak will I of the other things I saw there.</p>
	</div>
	<div class="stanza">
		<p>I cannot well repeat how there I entered,</p>
		<p class="slindent">So full was I of slumber at the moment</p>
		<p class="slindent">In which I had abandoned the true way.</p>
	</div>
	<div class="stanza">
		<p>But after I had reached a mountain&rsquo;s foot,</p>
		<p class="slindent">At that point where the valley terminated,</p>
		<p class="slindent">Which had with consternation pierced my heart,</p>
	</div>
	<div class="stanza">
		<p>Upward I looked, and I beheld its shoulders,</p>
		<p class="slindent">Vested already with that planet&rsquo;s rays</p>
		<p class="slindent">Which leadeth others right by every road.</p>
	</div>
	<div class="stanza">
		<p>Then was the fear a little quieted</p>
		<p class="slindent">That in my heart&rsquo;s lake had endured throughout</p>
		<p class="slindent">The night, which I had passed so piteously.</p>
	</div>
	<div class="stanza">
		<p>And even as he, who, with distressful breath,</p>
		<p class="slindent">Forth issued from the sea upon the shore,</p>
		<p class="slindent">Turns to the water perilous and gazes;</p>
	</div>
	<div class="stanza">
		<p>So did my soul, that still was fleeing onward,</p>
		<p class="slindent">Turn itself back to re-behold the pass</p>
		<p class="slindent">Which never yet a living person left.</p>
	</div>
	<div class="stanza">
		<p>After my weary body I had rested,</p>
		<p class="slindent">The way resumed I on the desert slope,</p>
		<p class="slindent">So that the firm foot ever was the lower.</p>
	</div>
	<div class="stanza">
		<p>And lo! almost where the ascent began,</p>
		<p class="slindent">A panther light and swift exceedingly,</p>
		<p class="slindent">Which with a spotted skin was covered o&rsquo;er!</p>
	</div>
	<div class="stanza">
		<p>And never moved she from before my face,</p>
		<p class="slindent">Nay, rather did impede so much my way,</p>
		<p class="slindent">That many times I to return had turned.</p>
	</div>
	<div class="stanza">
		<p>The time was the beginning of the morning,</p>
		<p class="slindent">And up the sun was mounting with those stars</p>
		<p class="slindent">That with him were, what time the Love Divine</p>
	</div>
	<div class="stanza">
		<p>At first in motion set those beauteous things;</p>
		<p class="slindent">So were to me occasion of good hope,</p>
		<p class="slindent">The variegated skin of that wild beast,</p>
	</div>
	<div class="stanza">
		<p>The hour of time, and the delicious season;</p>
		<p class="slindent">But not so much, that did not give me fear</p>
		<p class="slindent">A lion&rsquo;s aspect which appeared to me.</p>
	</div>
	<div class="stanza">
		<p>He seemed as if against me he were coming</p>
		<p class="slindent">With head uplifted, and with ravenous hunger,</p>
		<p class="slindent">So that it seemed the air was afraid of him;</p>
	</div>
	<div class="stanza">
		<p>And a she-wolf, that with all hungerings</p>
		<p class="slindent">Seemed to be laden in her meagreness,</p>
		<p class="slindent">And many folk has caused to live forlorn!</p>
	</div>
	<div class="stanza">
		<p>She brought upon me so much heaviness,</p>
		<p class="slindent">With the affright that from her aspect came,</p>
		<p class="slindent">That I the hope relinquished of the height.</p>
	</div>
	<div class="stanza">
		<p>And as he is who willingly acquires,</p>
		<p class="slindent">And the time comes that causes him to lose,</p>
		<p class="slindent">Who weeps in all his thoughts and is despondent,</p>
	</div>
	<div class="stanza">
		<p>E&rsquo;en such made me that beast withouten peace,</p>
		<p class="slindent">Which, coming on against me by degrees</p>
		<p class="slindent">Thrust me back thither where the sun is silent.</p>
	</div>
	<div class="stanza">
		<p>While I was rushing downward to the lowland,</p>
		<p class="slindent">Before mine eyes did one present himself,</p>
		<p class="slindent">Who seemed from long-continued silence hoarse.</p>
	</div>
	<div class="stanza">
		<p>When I beheld him in the desert vast,</p>
		<p class="slindent">&ldquo;Have pity on me,&rdquo; unto him I cried,</p>
		<p class="slindent">&ldquo;Whiche&rsquo;er thou art, or shade or real man!&rdquo;</p>
	</div>
	<div class="stanza">
		<p>He answered me: &ldquo;Not man; man once I was,</p>
		<p class="slindent">And both my parents were of Lombardy,</p>
		<p class="slindent">And Mantuans by country both of them.</p>
	</div>
	<div class="stanza">
		<p>&lsquo;Sub Julio&rsquo; was I born, though it was late,</p>
		<p class="slindent">And lived at Rome under the good Augustus,</p>
		<p class="slindent">During the time of false and lying gods.</p>
	</div>
	<div class="stanza">
		<p>A poet was I, and I sang that just</p>
		<p class="slindent">Son of Anchises, who came forth from Troy,</p>
		<p class="slindent">After that Ilion the superb was burned.</p>
	</div>
	<div class="stanza">
		<p>But thou, why goest thou back to such annoyance?</p>
		<p class="slindent">Why climb&rsquo;st thou not the Mount Delectable,</p>
		<p class="slindent">Which is the source and cause of every joy?&rdquo;</p>
	</div>
	<div class="stanza">
		<p>&ldquo;Now, art thou that Virgilius and that fountain</p>
		<p class="slindent">Which spreads abroad so wide a river of speech?&rdquo;</p>
		<p class="slindent">I made response to him with bashful forehead.</p>
	</div>
	<div class="stanza">
		<p>&ldquo;O, of the other poets honour and light,</p>
		<p class="slindent">Avail me the long study and great love</p>
		<p class="slindent">That have impelled me to explore thy volume!</p>
	</div>
	<div class="stanza">
		<p>Thou art my master, and my author thou,</p>
		<p class="slindent">Thou art alone the one from whom I took</p>
		<p class="slindent">The beautiful style that has done honour to me.</p>
	</div>
	<div class="stanza">
		<p>Behold the beast, for which I have turned back;</p>
		<p class="slindent">Do thou protect me from her, famous Sage,</p>
		<p class="slindent">For she doth make my veins and pulses tremble.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>&ldquo;Thee it behoves to take another road,&rdquo;</p>
		<p class="slindent">Responded he, when he beheld me weeping,</p>
		<p class="slindent">&ldquo;If from this savage place thou wouldst escape;</p>
	</div>
	<div class="stanza">
		<p>Because this beast, at which thou criest out,</p>
		<p class="slindent">Suffers not any one to pass her way,</p>
		<p class="slindent">But so doth harass him, that she destroys him;</p>
	</div>
	<div class="stanza">
		<p>And has a nature so malign and ruthless,</p>
		<p class="slindent">That never doth she glut her greedy will,</p>
		<p class="slindent">And after food is hungrier than before.</p>
	</div>
	<div class="stanza">
		<p>Many the animals with whom she weds,</p>
		<p class="slindent">And more they shall be still, until the Greyhound</p>
		<p class="slindent">Comes, who shall make her perish in her pain.</p>
	</div>
	<div class="stanza">
		<p>He shall not feed on either earth or pelf,</p>
		<p class="slindent">But upon wisdom, and on love and virtue;</p>
		<p class="slindent">&rsquo;Twixt Feltro and Feltro shall his nation be;</p>
	</div>
	<div class="stanza">
		<p>Of that low Italy shall he be the saviour,</p>
		<p class="slindent">On whose account the maid Camilla died,</p>
		<p class="slindent">Euryalus, Turnus, Nisus, of their wounds;</p>
	</div>
	<div class="stanza">
		<p>Through every city shall he hunt her down,</p>
		<p class="slindent">Until he shall have driven her back to Hell,</p>
		<p class="slindent">There from whence envy first did let her loose.</p>
	</div>
	<div class="stanza">
		<p>Therefore I think and judge it for thy best</p>
		<p class="slindent">Thou follow me, and I will be thy guide,</p>
		<p class="slindent">And lead thee hence through the eternal place,</p>
	</div>
	<div class="stanza">
		<p>Where thou shalt hear the desperate lamentations,</p>
		<p class="slindent">Shalt see the ancient spirits disconsolate,</p>
		<p class="slindent">Who cry out each one for the second death;</p>
	</div>
	<div class="stanza">
		<p>And thou shalt see those who contented are</p>
		<p class="slindent">Within the fire, because they hope to come,</p>
		<p class="slindent">Whene&rsquo;er it may be, to the blessed people;</p>
	</div>
	<div class="stanza">
		<p>To whom, then, if thou wishest to ascend,</p>
		<p class="slindent">A soul shall be for that than I more worthy;</p>
		<p class="slindent">With her at my departure I will leave thee;</p>
	</div>
	<div class="stanza">
		<p>Because that Emperor, who reigns above,</p>
		<p class="slindent">In that I was rebellious to his law,</p>
		<p class="slindent">Wills that through me none come into his city.</p>
	</div>
	<div class="stanza">
		<p>He governs everywhere, and there he reigns;</p>
		<p class="slindent">There is his city and his lofty throne;</p>
		<p class="slindent">O happy he whom thereto he elects!&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And I to him: &ldquo;Poet, I thee entreat,</p>
		<p class="slindent">By that same God whom thou didst never know,</p>
		<p class="slindent">So that I may escape this woe and worse,</p>
	</div>
	<div class="stanza">
		<p>Thou wouldst conduct me there where thou hast said,</p>
		<p class="slindent">That I may see the portal of Saint Peter,</p>
		<p class="slindent">And those thou makest so disconsolate.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>Then he moved on, and I behind him followed.</p>
	</div>`,

	`<p class="cantohead">Inferno: Canto II</p>
	<div class="stanza">
		<p>Day was departing, and the embrowned air</p>
		<p class="slindent">Released the animals that are on earth</p>
		<p class="slindent">From their fatigues; and I the only one</p>
	</div>
	<div class="stanza">
		<p>Made myself ready to sustain the war,</p>
		<p class="slindent">Both of the way and likewise of the woe,</p>
		<p class="slindent">Which memory that errs not shall retrace.</p>
	</div>
	<div class="stanza">
		<p>O Muses, O high genius, now assist me!</p>
		<p class="slindent">O memory, that didst write down what I saw,</p>
		<p class="slindent">Here thy nobility shall be manifest!</p>
	</div>
	<div class="stanza">
		<p>And I began: &ldquo;Poet, who guidest me,</p>
		<p class="slindent">Regard my manhood, if it be sufficient,</p>
		<p class="slindent">Ere to the arduous pass thou dost confide me.</p>
	</div>
	<div class="stanza">
		<p>Thou sayest, that of Silvius the parent,</p>
		<p class="slindent">While yet corruptible, unto the world</p>
		<p class="slindent">Immortal went, and was there bodily.</p>
	</div>
	<div class="stanza">
		<p>But if the adversary of all evil</p>
		<p class="slindent">Was courteous, thinking of the high effect</p>
		<p class="slindent">That issue would from him, and who, and what,</p>
	</div>
	<div class="stanza">
		<p>To men of intellect unmeet it seems not;</p>
		<p class="slindent">For he was of great Rome, and of her empire</p>
		<p class="slindent">In the empyreal heaven as father chosen;</p>
	</div>
	<div class="stanza">
		<p>The which and what, wishing to speak the truth,</p>
		<p class="slindent">Were stablished as the holy place, wherein</p>
		<p class="slindent">Sits the successor of the greatest Peter.</p>
	</div>
	<div class="stanza">
		<p>Upon this journey, whence thou givest him vaunt,</p>
		<p class="slindent">Things did he hear, which the occasion were</p>
		<p class="slindent">Both of his victory and the papal mantle.</p>
	</div>
	<div class="stanza">
		<p>Thither went afterwards the Chosen Vessel,</p>
		<p class="slindent">To bring back comfort thence unto that Faith,</p>
		<p class="slindent">Which of salvation&rsquo;s way is the beginning.</p>
	</div>
	<div class="stanza">
		<p>But I, why thither come, or who concedes it?</p>
		<p class="slindent">I not Aeneas am, I am not Paul,</p>
		<p class="slindent">Nor I, nor others, think me worthy of it.</p>
	</div>
	<div class="stanza">
		<p>Therefore, if I resign myself to come,</p>
		<p class="slindent">I fear the coming may be ill-advised;</p>
		<p class="slindent">Thou&rsquo;rt wise, and knowest better than I speak.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And as he is, who unwills what he willed,</p>
		<p class="slindent">And by new thoughts doth his intention change,</p>
		<p class="slindent">So that from his design he quite withdraws,</p>
	</div>
	<div class="stanza">
		<p>Such I became, upon that dark hillside,</p>
		<p class="slindent">Because, in thinking, I consumed the emprise,</p>
		<p class="slindent">Which was so very prompt in the beginning.</p>
	</div>
	<div class="stanza">
		<p>&ldquo;If I have well thy language understood,&rdquo;</p>
		<p class="slindent">Replied that shade of the Magnanimous,</p>
		<p class="slindent">&ldquo;Thy soul attainted is with cowardice,</p>
	</div>
	<div class="stanza">
		<p>Which many times a man encumbers so,</p>
		<p class="slindent">It turns him back from honoured enterprise,</p>
		<p class="slindent">As false sight doth a beast, when he is shy.</p>
	</div>
	<div class="stanza">
		<p>That thou mayst free thee from this apprehension,</p>
		<p class="slindent">I&rsquo;ll tell thee why I came, and what I heard</p>
		<p class="slindent">At the first moment when I grieved for thee.</p>
	</div>
	<div class="stanza">
		<p>Among those was I who are in suspense,</p>
		<p class="slindent">And a fair, saintly Lady called to me</p>
		<p class="slindent">In such wise, I besought her to command me.</p>
	</div>
	<div class="stanza">
		<p>Her eyes where shining brighter than the Star;</p>
		<p class="slindent">And she began to say, gentle and low,</p>
		<p class="slindent">With voice angelical, in her own language:</p>
	</div>
	<div class="stanza">
		<p>&lsquo;O spirit courteous of Mantua,</p>
		<p class="slindent">Of whom the fame still in the world endures,</p>
		<p class="slindent">And shall endure, long-lasting as the world;</p>
	</div>
	<div class="stanza">
		<p>A friend of mine, and not the friend of fortune,</p>
		<p class="slindent">Upon the desert slope is so impeded</p>
		<p class="slindent">Upon his way, that he has turned through terror,</p>
	</div>
	<div class="stanza">
		<p>And may, I fear, already be so lost,</p>
		<p class="slindent">That I too late have risen to his succour,</p>
		<p class="slindent">From that which I have heard of him in Heaven.</p>
	</div>
	<div class="stanza">
		<p>Bestir thee now, and with thy speech ornate,</p>
		<p class="slindent">And with what needful is for his release,</p>
		<p class="slindent">Assist him so, that I may be consoled.</p>
	</div>
	<div class="stanza">
		<p>Beatrice am I, who do bid thee go;</p>
		<p class="slindent">I come from there, where I would fain return;</p>
		<p class="slindent">Love moved me, which compelleth me to speak.</p>
	</div>
	<div class="stanza">
		<p>When I shall be in presence of my Lord,</p>
		<p class="slindent">Full often will I praise thee unto him.&rsquo;</p>
		<p class="slindent">Then paused she, and thereafter I began:</p>
	</div>
	<div class="stanza">
		<p>&lsquo;O Lady of virtue, thou alone through whom</p>
		<p class="slindent">The human race exceedeth all contained</p>
		<p class="slindent">Within the heaven that has the lesser circles,</p>
	</div>
	<div class="stanza">
		<p>So grateful unto me is thy commandment,</p>
		<p class="slindent">To obey, if &lsquo;twere already done, were late;</p>
		<p class="slindent">No farther need&lsquo;st thou ope to me thy wish.</p>
	</div>
	<div class="stanza">
		<p>But the cause tell me why thou dost not shun</p>
		<p class="slindent">The here descending down into this centre,</p>
		<p class="slindent">From the vast place thou burnest to return to.&rsquo;</p>
	</div>
	<div class="stanza">
		<p>&lsquo;Since thou wouldst fain so inwardly discern,</p>
		<p class="slindent">Briefly will I relate,&rsquo; she answered me,</p>
		<p class="slindent">&lsquo;Why I am not afraid to enter here.</p>
	</div>
	<div class="stanza">
		<p>Of those things only should one be afraid</p>
		<p class="slindent">Which have the power of doing others harm;</p>
		<p class="slindent">Of the rest, no; because they are not fearful.</p>
	</div>
	<div class="stanza">
		<p>God in his mercy such created me</p>
		<p class="slindent">That misery of yours attains me not,</p>
		<p class="slindent">Nor any flame assails me of this burning.</p>
	</div>
	<div class="stanza">
		<p>A gentle Lady is in Heaven, who grieves</p>
		<p class="slindent">At this impediment, to which I send thee,</p>
		<p class="slindent">So that stern judgment there above is broken.</p>
	</div>
	<div class="stanza">
		<p>In her entreaty she besought Lucia,</p>
		<p class="slindent">And said, &ldquo;Thy faithful one now stands in need</p>
		<p class="slindent">Of thee, and unto thee I recommend him.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>Lucia, foe of all that cruel is,</p>
		<p class="slindent">Hastened away, and came unto the place</p>
		<p class="slindent">Where I was sitting with the ancient Rachel.</p>
	</div>
	<div class="stanza">
		<p>&ldquo;Beatrice&rdquo; said she, &ldquo;the true praise of God,</p>
		<p class="slindent">Why succourest thou not him, who loved thee so,</p>
		<p class="slindent">For thee he issued from the vulgar herd?</p>
	</div>
	<div class="stanza">
		<p>Dost thou not hear the pity of his plaint?</p>
		<p class="slindent">Dost thou not see the death that combats him</p>
		<p class="slindent">Beside that flood, where ocean has no vaunt?&rdquo;</p>
	</div>
	<div class="stanza">
		<p>Never were persons in the world so swift</p>
		<p class="slindent">To work their weal and to escape their woe,</p>
		<p class="slindent">As I, after such words as these were uttered,</p>
	</div>
	<div class="stanza">
		<p>Came hither downward from my blessed seat,</p>
		<p class="slindent">Confiding in thy dignified discourse,</p>
		<p class="slindent">Which honours thee, and those who&rsquo;ve listened to it.&rsquo;</p>
	</div>
	<div class="stanza">
		<p>After she thus had spoken unto me,</p>
		<p class="slindent">Weeping, her shining eyes she turned away;</p>
		<p class="slindent">Whereby she made me swifter in my coming;</p>
	</div>
	<div class="stanza">
		<p>And unto thee I came, as she desired;</p>
		<p class="slindent">I have delivered thee from that wild beast,</p>
		<p class="slindent">Which barred the beautiful mountain&rsquo;s short ascent.</p>
	</div>
	<div class="stanza">
		<p>What is it, then?  Why, why dost thou delay?</p>
		<p class="slindent">Why is such baseness bedded in thy heart?</p>
		<p class="slindent">Daring and hardihood why hast thou not,</p>
	</div>
	<div class="stanza">
		<p>Seeing that three such Ladies benedight</p>
		<p class="slindent">Are caring for thee in the court of Heaven,</p>
		<p class="slindent">And so much good my speech doth promise thee?&rdquo;</p>
	</div>
	<div class="stanza">
		<p>Even as the flowerets, by nocturnal chill,</p>
		<p class="slindent">Bowed down and closed, when the sun whitens them,</p>
		<p class="slindent">Uplift themselves all open on their stems;</p>
	</div>
	<div class="stanza">
		<p>Such I became with my exhausted strength,</p>
		<p class="slindent">And such good courage to my heart there coursed,</p>
		<p class="slindent">That I began, like an intrepid person:</p>
	</div>
	<div class="stanza">
		<p>&ldquo;O she compassionate, who succoured me,</p>
		<p class="slindent">And courteous thou, who hast obeyed so soon</p>
		<p class="slindent">The words of truth which she addressed to thee!</p>
	</div>
	<div class="stanza">
		<p>Thou hast my heart so with desire disposed</p>
		<p class="slindent">To the adventure, with these words of thine,</p>
		<p class="slindent">That to my first intent I have returned.</p>
	</div>
	<div class="stanza">
		<p>Now go, for one sole will is in us both,</p>
		<p class="slindent">Thou Leader, and thou Lord, and Master thou.&rdquo;</p>
		<p class="slindent">Thus said I to him; and when he had moved,</p>
	</div>
	<div class="stanza">
		<p>I entered on the deep and savage way.</p>
	</div>`,

	`<p class="cantohead">Inferno: Canto III</p>
	<div class="stanza">
		<p>&ldquo;Through me the way is to the city dolent;</p>
		<p class="slindent">Through me the way is to eternal dole;</p>
		<p class="slindent">Through me the way among the people lost.</p>
	</div>
	<div class="stanza">
		<p>Justice incited my sublime Creator;</p>
		<p class="slindent">Created me divine Omnipotence,</p>
		<p class="slindent">The highest Wisdom and the primal Love.</p>
	</div>
	<div class="stanza">
		<p>Before me there were no created things,</p>
		<p class="slindent">Only eterne, and I eternal last.</p>
		<p class="slindent">All hope abandon, ye who enter in!&rdquo;</p>
	</div>
	<div class="stanza">
		<p>These words in sombre colour I beheld</p>
		<p class="slindent">Written upon the summit of a gate;</p>
		<p class="slindent">Whence I: &ldquo;Their sense is, Master, hard to me!&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And he to me, as one experienced:</p>
		<p class="slindent">&ldquo;Here all suspicion needs must be abandoned,</p>
		<p class="slindent">All cowardice must needs be here extinct.</p>
	</div>
	<div class="stanza">
		<p>We to the place have come, where I have told thee</p>
		<p class="slindent">Thou shalt behold the people dolorous</p>
		<p class="slindent">Who have foregone the good of intellect.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And after he had laid his hand on mine</p>
		<p class="slindent">With joyful mien, whence I was comforted,</p>
		<p class="slindent">He led me in among the secret things.</p>
	</div>
	<div class="stanza">
		<p>There sighs, complaints, and ululations loud</p>
		<p class="slindent">Resounded through the air without a star,</p>
		<p class="slindent">Whence I, at the beginning, wept thereat.</p>
	</div>
	<div class="stanza">
		<p>Languages diverse, horrible dialects,</p>
		<p class="slindent">Accents of anger, words of agony,</p>
		<p class="slindent">And voices high and hoarse, with sound of hands,</p>
	</div>
	<div class="stanza">
		<p>Made up a tumult that goes whirling on</p>
		<p class="slindent">For ever in that air for ever black,</p>
		<p class="slindent">Even as the sand doth, when the whirlwind breathes.</p>
	</div>
	<div class="stanza">
		<p>And I, who had my head with horror bound,</p>
		<p class="slindent">Said: &ldquo;Master, what is this which now I hear?</p>
		<p class="slindent">What folk is this, which seems by pain so vanquished?&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And he to me: &ldquo;This miserable mode</p>
		<p class="slindent">Maintain the melancholy souls of those</p>
		<p class="slindent">Who lived withouten infamy or praise.</p>
	</div>
	<div class="stanza">
		<p>Commingled are they with that caitiff choir</p>
		<p class="slindent">Of Angels, who have not rebellious been,</p>
		<p class="slindent">Nor faithful were to God, but were for self.</p>
	</div>
	<div class="stanza">
		<p>The heavens expelled them, not to be less fair;</p>
		<p class="slindent">Nor them the nethermore abyss receives,</p>
		<p class="slindent">For glory none the damned would have from them.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And I: &ldquo;O Master, what so grievous is</p>
		<p class="slindent">To these, that maketh them lament so sore?&rdquo;</p>
		<p class="slindent">He answered: &ldquo;I will tell thee very briefly.</p>
	</div>
	<div class="stanza">
		<p>These have no longer any hope of death;</p>
		<p class="slindent">And this blind life of theirs is so debased,</p>
		<p class="slindent">They envious are of every other fate.</p>
	</div>
	<div class="stanza">
		<p>No fame of them the world permits to be;</p>
		<p class="slindent">Misericord and Justice both disdain them.</p>
		<p class="slindent">Let us not speak of them, but look, and pass.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And I, who looked again, beheld a banner,</p>
		<p class="slindent">Which, whirling round, ran on so rapidly,</p>
		<p class="slindent">That of all pause it seemed to me indignant;</p>
	</div>
	<div class="stanza">
		<p>And after it there came so long a train</p>
		<p class="slindent">Of people, that I ne&rsquo;er would have believed</p>
		<p class="slindent">That ever Death so many had undone.</p>
	</div>
	<div class="stanza">
		<p>When some among them I had recognised,</p>
		<p class="slindent">I looked, and I beheld the shade of him</p>
		<p class="slindent">Who made through cowardice the great refusal.</p>
	</div>
	<div class="stanza">
		<p>Forthwith I comprehended, and was certain,</p>
		<p class="slindent">That this the sect was of the caitiff wretches</p>
		<p class="slindent">Hateful to God and to his enemies.</p>
	</div>
	<div class="stanza">
		<p>These miscreants, who never were alive,</p>
		<p class="slindent">Were naked, and were stung exceedingly</p>
		<p class="slindent">By gadflies and by hornets that were there.</p>
	</div>
	<div class="stanza">
		<p>These did their faces irrigate with blood,</p>
		<p class="slindent">Which, with their tears commingled, at their feet</p>
		<p class="slindent">By the disgusting worms was gathered up.</p>
</div>
	<div class="stanza">
		<p>And when to gazing farther I betook me.</p>
		<p class="slindent">People I saw on a great river&rsquo;s bank;</p>
		<p class="slindent">Whence said I: &ldquo;Master, now vouchsafe to me,</p>
</div>
	<div class="stanza">
		<p>That I may know who these are, and what law</p>
		<p class="slindent">Makes them appear so ready to pass over,</p>
		<p class="slindent">As I discern athwart the dusky light.&rdquo;</p>
</div>
	<div class="stanza">
		<p>And he to me: &ldquo;These things shall all be known</p>
		<p class="slindent">To thee, as soon as we our footsteps stay</p>
		<p class="slindent">Upon the dismal shore of Acheron.&rdquo;</p>
</div>
	<div class="stanza">
		<p>Then with mine eyes ashamed and downward cast,</p>
		<p class="slindent">Fearing my words might irksome be to him,</p>
		<p class="slindent">From speech refrained I till we reached the river.</p>
</div>
	<div class="stanza">
		<p>And lo! towards us coming in a boat</p>
		<p class="slindent">An old man, hoary with the hair of eld,</p>
		<p class="slindent">Crying: &ldquo;Woe unto you, ye souls depraved!</p>
	</div>
	<div class="stanza">
		<p>Hope nevermore to look upon the heavens;</p>
		<p class="slindent">I come to lead you to the other shore,</p>
		<p class="slindent">To the eternal shades in heat and frost.</p>
	</div>
	<div class="stanza">
		<p>And thou, that yonder standest, living soul,</p>
		<p class="slindent">Withdraw thee from these people, who are dead!&rdquo;</p>
		<p class="slindent">But when he saw that I did not withdraw,</p>
	</div>
	<div class="stanza">
		<p>He said: &ldquo;By other ways, by other ports</p>
		<p class="slindent">Thou to the shore shalt come, not here, for passage;</p>
		<p class="slindent">A lighter vessel needs must carry thee.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>And unto him the Guide: &ldquo;Vex thee not, Charon;</p>
		<p class="slindent">It is so willed there where is power to do</p>
		<p class="slindent">That which is willed; and farther question not.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>Thereat were quieted the fleecy cheeks</p>
		<p class="slindent">Of him the ferryman of the livid fen,</p>
		<p class="slindent">Who round about his eyes had wheels of flame.</p>
	</div>
	<div class="stanza">
		<p>But all those souls who weary were and naked</p>
		<p class="slindent">Their colour changed and gnashed their teeth together,</p>
		<p class="slindent">As soon as they had heard those cruel words.</p>
	</div>
	<div class="stanza">
		<p>God they blasphemed and their progenitors,</p>
		<p class="slindent">The human race, the place, the time, the seed</p>
		<p class="slindent">Of their engendering and of their birth!</p>
	</div>
	<div class="stanza">
		<p>Thereafter all together they drew back,</p>
		<p class="slindent">Bitterly weeping, to the accursed shore,</p>
		<p class="slindent">Which waiteth every man who fears not God.</p>
	</div>
	<div class="stanza">
		<p>Charon the demon, with the eyes of glede,</p>
		<p class="slindent">Beckoning to them, collects them all together,</p>
		<p class="slindent">Beats with his oar whoever lags behind.</p>
	</div>
	<div class="stanza">
		<p>As in the autumn-time the leaves fall off,</p>
		<p class="slindent">First one and then another, till the branch</p>
		<p class="slindent">Unto the earth surrenders all its spoils;</p>
	</div>
	<div class="stanza">
		<p>In similar wise the evil seed of Adam</p>
		<p class="slindent">Throw themselves from that margin one by one,</p>
		<p class="slindent">At signals, as a bird unto its lure.</p>
	</div>
	<div class="stanza">
		<p>So they depart across the dusky wave,</p>
		<p class="slindent">And ere upon the other side they land,</p>
		<p class="slindent">Again on this side a new troop assembles.</p>
	</div>
	<div class="stanza">
		<p>&ldquo;My son,&rdquo; the courteous Master said to me,</p>
		<p class="slindent">&ldquo;All those who perish in the wrath of God</p>
		<p class="slindent">Here meet together out of every land;</p>
	</div>
	<div class="stanza">
		<p>And ready are they to pass o&rsquo;er the river,</p>
		<p class="slindent">Because celestial Justice spurs them on,</p>
		<p class="slindent">So that their fear is turned into desire.</p>
	</div>
	<div class="stanza">
		<p>This way there never passes a good soul;</p>
		<p class="slindent">And hence if Charon doth complain of thee,</p>
		<p class="slindent">Well mayst thou know now what his speech imports.&rdquo;</p>
	</div>
	<div class="stanza">
		<p>This being finished, all the dusk champaign</p>
		<p class="slindent">Trembled so violently, that of that terror</p>
		<p class="slindent">The recollection bathes me still with sweat.</p>
	</div>
	<div class="stanza">
		<p>The land of tears gave forth a blast of wind,</p>
		<p class="slindent">And fulminated a vermilion light,</p>
		<p class="slindent">Which overmastered in me every sense,</p>
	</div>
	<div class="stanza">
		<p>And as a man whom sleep hath seized I fell.</p>
	</div>`];

module.exports = longfellow;
